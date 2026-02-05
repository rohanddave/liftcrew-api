import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from '../entities/exercise.entity';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';

/**
 * Service responsible for managing exercise business logic and database operations.
 * Uses TypeORM repository pattern for data persistence.
 */
@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
  ) {}

  /**
   * Retrieves all exercises from the database.
   * @returns Promise<Exercise[]> Array of all exercise entities
   */
  async findAll(): Promise<Exercise[]> {
    return this.exerciseRepository.find({
      relations: { muscleGroups: true },
    });
  }

  /**
   * Finds a single exercise by its unique identifier.
   * Throws an exception if the exercise is not found.
   * @param id - The UUID of the exercise to find
   * @returns Promise<Exercise> The exercise entity
   * @throws NotFoundException if no exercise exists with the given ID
   */
  async findOneOrFail(id: string): Promise<Exercise> {
    const exercise = await this.exerciseRepository.findOne({
      where: { id },
      relations: { muscleGroups: true },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

    return exercise;
  }

  /**
   * Finds a single exercise by its unique identifier.
   * Returns null if the exercise is not found.
   * @param id - The UUID of the exercise to find
   * @returns Promise<Exercise | null> The exercise entity if found, null otherwise
   */
  async findOne(id: string): Promise<Exercise | null> {
    return this.exerciseRepository.findOne({
      where: { id },
      relations: { muscleGroups: true },
    });
  }

  /**
   * Creates a new exercise in the database.
   * @param createExerciseDto - The data transfer object containing exercise information
   * @returns Promise<Exercise> The newly created and saved exercise entity
   */
  async create(createExerciseDto: CreateExerciseDto): Promise<Exercise> {
    const exercise = this.exerciseRepository.create(createExerciseDto);
    return this.exerciseRepository.save(exercise);
  }

  /**
   * Updates an existing exercise's information.
   * @param id - The UUID of the exercise to update
   * @param updateExerciseDto - The data transfer object containing updated exercise information
   * @returns Promise<Exercise> The updated exercise entity
   * @throws NotFoundException if no exercise exists with the given ID
   */
  async update(
    id: string,
    updateExerciseDto: UpdateExerciseDto,
  ): Promise<Exercise> {
    const exercise = await this.findOneOrFail(id);
    Object.assign(exercise, updateExerciseDto);
    return this.exerciseRepository.save(exercise);
  }

  /**
   * Removes an exercise from the database.
   * @param id - The UUID of the exercise to remove
   * @returns Promise<void>
   * @throws NotFoundException if no exercise exists with the given ID
   */
  async remove(id: string): Promise<void> {
    const exercise = await this.findOneOrFail(id);
    await this.exerciseRepository.remove(exercise);
  }
}
