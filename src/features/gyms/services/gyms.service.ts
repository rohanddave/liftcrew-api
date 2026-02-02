import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Gym } from '../entities/gym.entity';
import { CreateGymDto } from '../dto/create-gym.dto';
import { UpdateGymDto } from '../dto/update-gym.dto';
import { User } from 'src/features/users/entities/user.entity';
import {
  NOTIFICATION_EVENTS,
  GymCheckInEvent,
} from 'src/features/notifications/interfaces/events.interface';
import { NotificationType } from 'src/features/notifications/types';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Retrieves all gyms from the database.
   * @returns Promise<Gym[]> Array of all gym entities
   */
  async findAll(): Promise<Gym[]> {
    return await this.gymRepository.find();
  }

  /**
   * Finds a single gym by its unique identifier.
   * Throws an exception if the gym is not found.
   * @param id - The UUID of the gym to find
   * @returns Promise<Gym> The gym entity
   * @throws NotFoundException if no gym exists with the given ID
   */
  async findOneOrFail(id: string): Promise<Gym> {
    const gym = await this.gymRepository.findOneByOrFail({ id });
    return gym;
  }

  /**
   * Finds a single gym by its unique identifier.
   * Returns null if the gym is not found.
   * @param id - The UUID of the gym to find
   * @returns Promise<Gym | null> The gym entity if found, null otherwise
   */
  async findOne(id: string): Promise<Gym | null> {
    const gym = await this.gymRepository.findOneByOrFail({ id });
    return gym;
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
    return await this.gymRepository.save(gym);
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
    return await this.gymRepository.save(gym);
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['homeGym'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.homeGym) {
      throw new BadRequestException('You have not set a home gym');
    }

    const homeGym = user.homeGym;

    // Calculate distance between user's location and home gym
    const distance = this.calculateDistance(
      lat,
      lng,
      homeGym.lat,
      homeGym.lng,
    );

    if (distance > this.CHECK_IN_THRESHOLD_METERS) {
      throw new BadRequestException(
        `You are too far from your home gym (${Math.round(distance)}m away, threshold is ${this.CHECK_IN_THRESHOLD_METERS}m)`,
      );
    }

    // Emit check-in event for notifications
    const gymCheckInEvent: GymCheckInEvent = {
      actorId: userId,
      type: NotificationType.GYM_CHECK_IN,
      gymId: homeGym.id,
      gymName: homeGym.name,
    };
    this.eventEmitter.emit(NOTIFICATION_EVENTS.GYM_CHECK_IN, gymCheckInEvent);

    return {
      success: true,
      message: `Successfully checked in at ${homeGym.name}`,
      gym: homeGym,
    };
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
