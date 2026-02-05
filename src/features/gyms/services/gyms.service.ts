import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Gym } from '../entities/gym.entity';
import { CreateGymDto } from '../dto/create-gym.dto';
import { UpdateGymDto } from '../dto/update-gym.dto';
import {
  NOTIFICATION_EVENTS,
  GymCheckInEvent,
} from 'src/features/notifications/interfaces/events.interface';
import { NotificationType } from 'src/features/notifications/types';
import { GymPresenceService } from './gym-presence.service';
import { FollowStatus } from 'src/features/social/types';
import { ActiveFollower } from '../types';
import { SocialService } from 'src/features/social/services/social.service';
import {
  paginate,
  PaginatedResult,
  PaginationDto,
} from 'src/common/pagination';
import { UsersService } from 'src/features/users/services/users.service';

/**
 * Service responsible for managing gym business logic and database operations.
 * Uses TypeORM repository pattern for data persistence.
 */
@Injectable()
export class GymsService {
  private readonly CHECK_IN_THRESHOLD_METERS = 200; // 200 meters

  constructor(
    @InjectRepository(Gym)
    private readonly gymRepository: Repository<Gym>,
    private readonly usersService: UsersService,
    private readonly presenceService: GymPresenceService,
    private readonly socialService: SocialService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Retrieves all gyms from the database.
   * @returns Promise<Gym[]> Array of all gym entities
   */
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Gym>> {
    return paginate<Gym>(this.gymRepository, paginationDto);
  }

  /**
   * Finds a single gym by its unique identifier.
   * Throws an exception if the gym is not found.
   * @param id - The UUID of the gym to find
   * @returns Promise<Gym> The gym entity
   * @throws NotFoundException if no gym exists with the given ID
   */
  async findOneOrFail(id: string): Promise<Gym> {
    try {
      const gym = await this.gymRepository.findOneByOrFail({ id });
      return gym;
    } catch (error) {
      throw new NotFoundException(`Gym with ID ${id} not found`);
    }
  }

  /**
   * Finds a single gym by its unique identifier.
   * Returns null if the gym is not found.
   * @param id - The UUID of the gym to find
   * @returns Promise<Gym | null> The gym entity if found, null otherwise
   */
  async findOne(id: string): Promise<Gym | null> {
    return this.gymRepository.findOneBy({ id });
  }

  /**
   * Creates a new gym in the database.
   * @param createGymDto - The data transfer object containing gym information
   * @returns Promise<Gym> The newly created and saved gym entity
   */
  async create(createGymDto: CreateGymDto): Promise<Gym> {
    // Create a new gym entity from the DTO
    const gym = this.gymRepository.create(createGymDto);

    // Persist the gym to the database
    return this.gymRepository.save(gym);
  }

  /**
   * Updates an existing gym's information.
   * @param id - The UUID of the gym to update
   * @param updateGymDto - The data transfer object containing updated gym information
   * @returns Promise<Gym> The updated gym entity
   * @throws NotFoundException if no gym exists with the given ID
   */
  async update(id: string, updateGymDto: UpdateGymDto): Promise<Gym> {
    // First, verify the gym exists (throws NotFoundException if not found)
    const gym = await this.findOneOrFail(id);

    // Merge the updates into the existing gym entity
    Object.assign(gym, updateGymDto);

    // Save and return the updated gym
    return this.gymRepository.save(gym);
  }

  /**
   * Removes a gym from the database.
   * @param id - The UUID of the gym to remove
   * @returns Promise<void>
   * @throws NotFoundException if no gym exists with the given ID
   */
  async remove(id: string): Promise<void> {
    // First, verify the gym exists (throws NotFoundException if not found)
    const gym = await this.findOneOrFail(id);

    // Remove the gym from the database
    await this.gymRepository.remove(gym);
  }

  /**
   * Check in a user at their home gym.
   * Validates that the user's location is within the threshold distance from their home gym.
   * If valid, emits a GYM_CHECK_IN event to notify followers.
   * @param userId - The UUID of the user checking in
   * @param lat - The user's current latitude
   * @param lng - The user's current longitude
   * @returns Promise<{ success: boolean; message: string; gym?: Gym }>
   * @throws BadRequestException if user has no home gym or is too far away
   */
  async checkIn(
    userId: string,
    lat: number,
    lng: number,
  ): Promise<{ success: boolean; message: string; gym?: Gym }> {
    // Get the user with their home gym
    const user = await this.usersService.findOneWithHomeGym(userId);

    if (!user.homeGym) {
      throw new BadRequestException('You have not set a home gym');
    }

    const homeGym = user.homeGym;

    // Calculate distance between user's location and home gym
    const distance = this.calculateDistance(lat, lng, homeGym.lat, homeGym.lng);

    if (distance > this.CHECK_IN_THRESHOLD_METERS) {
      throw new BadRequestException(
        `You are too far from your home gym (${Math.round(distance)}m away, threshold is ${this.CHECK_IN_THRESHOLD_METERS}m)`,
      );
    }

    // Track presence first - if this fails, don't emit the event
    try {
      await this.presenceService.checkIn(homeGym.id, userId, {
        username: user.username,
      });
    } catch (error) {
      console.error('Error during gym check-in presence tracking:', error);
      throw new InternalServerErrorException('Failed to record check-in');
    }

    // Emit check-in event for notifications
    this.eventEmitter.emit(NOTIFICATION_EVENTS.GYM_CHECK_IN, {
      actorId: userId,
      type: NotificationType.GYM_CHECK_IN,
      gymId: homeGym.id,
      gymName: homeGym.name,
    } satisfies GymCheckInEvent);

    return {
      success: true,
      message: `Successfully checked in at ${homeGym.name}`,
      gym: homeGym,
    };
  }

  /**
   * Check out a user from a gym.
   * @param gymId - The UUID of the gym to check out from
   * @param userId - The UUID of the user checking out
   * @returns Promise<{ success: boolean; message: string }>
   * @throws NotFoundException if gym doesn't exist
   * @throws BadRequestException if user is not checked in at this gym
   */
  async checkOut(
    gymId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validate gym exists
    const [gym, isCheckedIn] = await Promise.all([
      this.findOneOrFail(gymId),
      this.presenceService.isUserCheckedIn(gymId, userId),
    ]);

    if (!isCheckedIn) {
      throw new BadRequestException('You are not checked in at this gym');
    }

    // Remove from presence tracking
    try {
      await this.presenceService.checkOut(gymId, userId);
    } catch (error) {
      throw new InternalServerErrorException('Failed to check out');
    }

    return {
      success: true,
      message: `Successfully checked out from ${gym.name}`,
    };
  }

  /**
   * Get active followers at a specific gym.
   * Returns users who the requesting user follows AND who are currently checked in.
   * @param gymId - The UUID of the gym
   * @param userId - The UUID of the requesting user
   * @returns Promise<ActiveFollower[]>
   * @throws NotFoundException if gym doesn't exist
   */
  async getActiveFollowersAtGym(
    gymId: string,
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<ActiveFollower[]> {
    // Validate gym exists
    await this.findOneOrFail(gymId);

    // Get active user IDs from Redis
    const activeUserIds = await this.presenceService.getActiveUsers(gymId);

    if (activeUserIds.length === 0) {
      return [];
    }

    // Get user's following list (accepted only)
    const followingResult = await this.socialService.getFollowing(
      userId,
      paginationDto,
      FollowStatus.ACCEPTED,
    );

    if (followingResult.data.length === 0) {
      return [];
    }

    // Use Set for O(1) lookup instead of Map if we only need IDs
    const followingIds = new Set(followingResult.data.map((f) => f.userId));

    // Filter and map in one pass
    const activeFollowers: ActiveFollower[] = activeUserIds
      .filter((user) => followingIds.has(user.userId))
      .map((user) => ({
        userId: user.userId,
        username: user.username,
      }));

    return activeFollowers;
  }

  /**
   * Calculate distance between two coordinates using the Haversine formula.
   * Returns distance in meters.
   * @param lat1 - Latitude of first point
   * @param lng1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lng2 - Longitude of second point
   * @returns Distance in meters
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
