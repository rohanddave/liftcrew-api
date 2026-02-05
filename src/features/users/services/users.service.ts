import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Gym } from 'src/features/gyms/entities/gym.entity';
import {
  paginate,
  PaginatedResult,
  PaginationDto,
} from 'src/common/pagination';

/**
 * Service responsible for managing user business logic and database operations.
 * Uses TypeORM repository pattern for data persistence.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Gym)
    private readonly gymsRepository: Repository<Gym>,
  ) {}

  /**
   * Retrieves all users from the database.
   * @returns Promise<User[]> Array of all user entities
   */
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<User>> {
    return paginate<User>(this.userRepository, paginationDto);
  }

  /**
   * Finds a single user by their unique identifier.
   * Throws an exception if the user is not found.
   * @param id - The UUID of the user to find
   * @returns Promise<User> The user entity
   * @throws NotFoundException if no user exists with the given ID
   */
  async findOneByEmailOrFail(email: string): Promise<User> {
    try {
      const user = await this.userRepository.findOneByOrFail({ email });
      return user;
    } catch (error) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
  }

  /**
   * Finds a single user by their unique identifier.
   * Throws an exception if the user is not found.
   * @param id - The UUID of the user to find
   * @returns Promise<User> The user entity
   * @throws NotFoundException if no user exists with the given ID
   */
  async findOneOrFail(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOneByOrFail({ id });
      return user;
    } catch (error) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  /**
   * Finds a single user by their unique identifier.
   * Throws an exception if the user is not found.
   * @param id - The UUID of the user to find
   * @returns Promise<User> The user entity
   * @throws NotFoundException if no user exists with the given ID
   */
  async findOneByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOneBy({ email });
      return user;
    } catch (error) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
  }

  /**
   * Finds a single user by their unique identifier.
   * Returns null if the user is not found.
   * @param id - The UUID of the user to find
   * @returns Promise<User | null> The user entity if found, null otherwise
   */
  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  /**
   * Creates a new user in the database.
   * @param createUserDto - The data transfer object containing user information
   * @returns Promise<User> The newly created and saved user entity with computed age property
   */
  async create(createUserDto: CreateUserDto, email: string): Promise<User> {
    try {
      await this.gymsRepository.findOneByOrFail({
        id: createUserDto.homeGymId,
      });
    } catch (error) {
      throw new NotFoundException(
        `Gym with id ${createUserDto.homeGymId} not found`,
      );
    }

    // Create a new user entity from the DTO
    const user = this.userRepository.create({
      ...createUserDto,
      email,
    });

    // Persist the user to the database
    return this.userRepository.save(user);
  }

  /**
   * Updates an existing user's information.
   * @param id - The UUID of the user to update
   * @param updateUserDto - The data transfer object containing updated user information
   * @returns Promise<User> The updated user entity
   * @throws NotFoundException if no user exists with the given ID
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // First, verify the user exists (throws NotFoundException if not found)
    const user = await this.findOneOrFail(id);

    // Validate that the gym exists if homeGymId is being updated
    if (updateUserDto.homeGymId) {
      await this.gymsRepository.findOneByOrFail({
        id: updateUserDto.homeGymId,
      });
    }

    // Merge the updates into the existing user entity
    Object.assign(user, updateUserDto);

    // Save and return the updated user
    return this.userRepository.save(user);
  }

  /**
   * Removes a user from the database.
   * @param id - The UUID of the user to remove
   * @returns Promise<void>
   * @throws NotFoundException if no user exists with the given ID
   */
  async remove(id: string): Promise<void> {
    // First, verify the user exists (throws NotFoundException if not found)
    const user = await this.findOneOrFail(id);

    // Remove the user from the database
    await this.userRepository.remove(user);
  }

  /**
   * Increments the kudos count for a user.
   * @param id - The UUID of the user
   * @returns Promise<void>
   * @throws NotFoundException if no user exists with the given ID
   */
  async incrementKudosCount(id: string): Promise<void> {
    const result = await this.userRepository.increment({ id }, 'kudosCount', 1);

    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  async findOneWithHomeGym(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { homeGym: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }
}
