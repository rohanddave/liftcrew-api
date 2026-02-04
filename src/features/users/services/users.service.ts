import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Gym } from 'src/features/gyms/entities/gym.entity';

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
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * Finds a single user by their unique identifier.
   * Throws an exception if the user is not found.
   * @param id - The UUID of the user to find
   * @returns Promise<User> The user entity
   * @throws EntityNotFoundError if no user exists with the given ID
   */
  async findOneByEmailOrFail(email: string): Promise<User> {
    const user = await this.userRepository.findOneByOrFail({ email });
    return user;
  }

  /**
   * Finds a single user by their unique identifier.
   * Throws an exception if the user is not found.
   * @param id - The UUID of the user to find
   * @returns Promise<User> The user entity
   * @throws EntityNotFoundError if no user exists with the given ID
   */
  async findOneOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOneByOrFail({ id });
    return user;
  }

  /**
   * Finds a single user by their unique identifier.
   * Throws an exception if the user is not found.
   * @param id - The UUID of the user to find
   * @returns Promise<User> The user entity
   * @throws EntityNotFoundError if no user exists with the given ID
   */
  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });
    return user;
  }

  /**
   * Finds a single user by their unique identifier.
   * Returns null if the user is not found.
   * @param id - The UUID of the user to find
   * @returns Promise<User | null> The user entity if found, null otherwise
   */
  async findOne(id: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ id });
    return user;
  }

  /**
   * Creates a new user in the database.
   * @param createUserDto - The data transfer object containing user information
   * @returns Promise<User> The newly created and saved user entity with computed age property
   */
  async create(createUserDto: CreateUserDto, email: string): Promise<User> {
    await this.gymsRepository.findOneByOrFail({ id: createUserDto.homeGymId });

    // Create a new user entity from the DTO
    const user = this.userRepository.create({
      ...createUserDto,
      email,
    });

    // Persist the user to the database
    const savedUser = await this.userRepository.save(user);

    // Reload the user to trigger the @AfterLoad hook that computes the age
    const userWithAge = await this.findOneOrFail(savedUser.id);
    return userWithAge;
  }

  /**
   * Updates an existing user's information.
   * @param id - The UUID of the user to update
   * @param updateUserDto - The data transfer object containing updated user information
   * @returns Promise<User> The updated user entity
   * @throws EntityNotFoundError if no user exists with the given ID
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // First, verify the user exists (throws EntityNotFoundError if not found)
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
    return await this.userRepository.save(user);
  }

  /**
   * Removes a user from the database.
   * @param id - The UUID of the user to remove
   * @returns Promise<void>
   * @throws EntityNotFoundError if no user exists with the given ID
   */
  async remove(id: string): Promise<void> {
    // First, verify the user exists (throws EntityNotFoundError if not found)
    const user = await this.findOneOrFail(id);
    // Remove the user from the database
    await this.userRepository.remove(user);
  }

  /**
   * Increments the kudos count for a user.
   * @param id - The UUID of the user
   * @returns Promise<void>
   * @throws EntityNotFoundError if no user exists with the given ID
   */
  async incrementKudosCount(id: string): Promise<void> {
    await this.userRepository.increment({ id }, 'kudosCount', 1);
  }
}
