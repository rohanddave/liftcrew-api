import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gym } from '../entities/gym.entity';
import { CreateGymDto } from '../dto/create-gym.dto';
import { UpdateGymDto } from '../dto/update-gym.dto';

/**
 * Service responsible for managing gym business logic and database operations.
 * Uses TypeORM repository pattern for data persistence.
 */
@Injectable()
export class GymsService {
  constructor(
    @InjectRepository(Gym)
    private readonly gymRepository: Repository<Gym>,
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
}
