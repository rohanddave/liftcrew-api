import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Workout } from '../entities/workout.entity';
import { WorkoutExercise } from '../entities/workout-exercise.entity';
import { ExerciseSet } from '../entities/set.entity';
import { WorkoutParticipant } from '../entities/workout-participant.entity';
import { CreateWorkoutDto } from '../dto/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/update-workout.dto';
import { AddWorkoutExerciseDto } from '../dto/add-workout-exercise.dto';
import { AddParticipantDto } from '../dto/add-participant.dto';
import { AddSetDto } from '../dto/add-set.dto';
import { WorkoutQueryDto } from '../dto/workout-query.dto';

/**
 * Service responsible for managing workout business logic and database operations.
 * Uses TypeORM repository pattern for data persistence.
 */
@Injectable()
export class WorkoutsService {
  private readonly MAX_PARTICIPANTS_PER_WORKOUT = 25;

  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepository: Repository<Workout>,
    @InjectRepository(WorkoutExercise)
    private readonly workoutExerciseRepository: Repository<WorkoutExercise>,
    @InjectRepository(ExerciseSet)
    private readonly exerciseSetRepository: Repository<ExerciseSet>,
    @InjectRepository(WorkoutParticipant)
    private readonly workoutParticipantRepository: Repository<WorkoutParticipant>,
  ) {}

  /**
   * Creates a new workout.
   * @param createWorkoutDto - The data transfer object containing workout information
   * @returns Promise<Workout> The newly created workout entity
   */
  async create(
    createdById: string,
    createWorkoutDto: CreateWorkoutDto,
  ): Promise<Workout> {
    const workout = this.workoutRepository.create({
      ...createWorkoutDto,
      createdById,
    });
    return await this.workoutRepository.save(workout);
  }

  /**
   * Finds a single workout by its unique identifier.
   * @param id - The UUID of the workout to find
   * @returns Promise<Workout> The workout entity
   * @throws NotFoundException if no workout exists with the given ID
   */
  async findOneOrFail(id: string): Promise<Workout> {
    const workout = await this.workoutRepository.findOne({
      where: { id },
      relations: ['createdBy', 'participants', 'exercises', 'exercises.sets'],
    });

    if (!workout) {
      throw new NotFoundException(`Workout with ID ${id} not found`);
    }

    return workout;
  }

  /**
   * Updates an existing workout's information.
   * @param id - The UUID of the workout to update
   * @param updateWorkoutDto - The data transfer object containing updated workout information
   * @returns Promise<Workout> The updated workout entity
   * @throws NotFoundException if no workout exists with the given ID
   */
  async update(
    id: string,
    updateWorkoutDto: UpdateWorkoutDto,
  ): Promise<Workout> {
    const workout = await this.findOneOrFail(id);
    Object.assign(workout, updateWorkoutDto);
    return await this.workoutRepository.save(workout);
  }

  /**
   * Adds an exercise with set information to a workout.
   * @param workoutId - The UUID of the workout
   * @param addWorkoutExerciseDto - The data transfer object containing exercise and set information
   * @returns Promise<WorkoutExercise> The created workout exercise with sets
   * @throws NotFoundException if workout doesn't exist
   */
  async addExerciseWithSets(
    workoutId: string,
    addWorkoutExerciseDto: AddWorkoutExerciseDto,
  ): Promise<WorkoutExercise> {
    await this.findOneOrFail(workoutId);

    // Check if the orderIndex is already taken
    const existingExercise = await this.workoutExerciseRepository.findOne({
      where: {
        workoutId,
        orderIndex: addWorkoutExerciseDto.orderIndex,
      },
    });

    if (existingExercise) {
      throw new BadRequestException(
        `Exercise at order index ${addWorkoutExerciseDto.orderIndex} already exists`,
      );
    }

    // Create the workout exercise
    const workoutExercise = this.workoutExerciseRepository.create({
      workoutId,
      exerciseId: addWorkoutExerciseDto.exerciseId,
      orderIndex: addWorkoutExerciseDto.orderIndex,
      notes: addWorkoutExerciseDto.notes,
      restSeconds: addWorkoutExerciseDto.restSeconds,
    });

    const savedWorkoutExercise =
      await this.workoutExerciseRepository.save(workoutExercise);

    // Create sets if provided
    if (addWorkoutExerciseDto.sets && addWorkoutExerciseDto.sets.length > 0) {
      const sets = addWorkoutExerciseDto.sets.map((setDto) =>
        this.exerciseSetRepository.create({
          workoutExerciseId: savedWorkoutExercise.id,
          ...setDto,
        }),
      );

      await this.exerciseSetRepository.save(sets);
    }

    // Return the workout exercise with sets
    return await this.workoutExerciseRepository.findOne({
      where: { id: savedWorkoutExercise.id },
      relations: ['exercise', 'sets'],
    });
  }

  /**
   * Removes an exercise and all its sets from a workout.
   * @param workoutId - The UUID of the workout
   * @param workoutExerciseId - The UUID of the workout exercise to remove
   * @returns Promise<void>
   * @throws NotFoundException if workout or exercise doesn't exist
   */
  async removeExerciseWithSets(
    workoutId: string,
    workoutExerciseId: string,
  ): Promise<void> {
    await this.findOneOrFail(workoutId);

    const workoutExercise = await this.workoutExerciseRepository.findOne({
      where: {
        id: workoutExerciseId,
        workoutId,
      },
    });

    if (!workoutExercise) {
      throw new NotFoundException(
        `Exercise with ID ${workoutExerciseId} not found in workout ${workoutId}`,
      );
    }

    // Sets will be automatically deleted due to CASCADE on delete
    await this.workoutExerciseRepository.remove(workoutExercise);
  }

  /**
   * Adds a participant to a workout.
   * TODO: Check friendship status before allowing participant to be added
   * @param workoutId - The UUID of the workout
   * @param addParticipantDto - The data transfer object containing participant information
   * @returns Promise<WorkoutParticipant> The created participant entity
   * @throws NotFoundException if workout doesn't exist
   * @throws BadRequestException if participant already exists
   */
  async addParticipant(
    userId: string,
    workoutId: string,
    addParticipantDto: AddParticipantDto,
  ): Promise<WorkoutParticipant> {
    const workout = await this.findOneOrFail(workoutId);

    if (addParticipantDto.userId === userId) {
      throw new BadRequestException(
        'Workout creator is already a participant by default',
      );
    }

    if (workout.createdById !== userId) {
      throw new BadRequestException(
        'Only the creator of the workout can add participants',
      );
    }

    const existingParticipants = await this.workoutParticipantRepository.find({
      where: {
        workoutId,
      },
    });

    if (existingParticipants.length >= this.MAX_PARTICIPANTS_PER_WORKOUT) {
      throw new BadRequestException(
        'Cannot add more participants: workout has reached the maximum limit of 25 participants',
      );
    }

    // TODO: Check friendship status before allowing participant to be added
    // Verify that the user being added is either:
    // 1. A friend of the workout creator
    // 2. The workout creator themselves
    // 3. Has been explicitly invited to the workout

    // Check if participant already exists
    const existingParticipant = existingParticipants.some(
      (participant) => participant.userId === addParticipantDto.userId,
    );

    if (existingParticipant) {
      throw new BadRequestException(
        `User ${addParticipantDto.userId} is already a participant in this workout`,
      );
    }

    const participant = this.workoutParticipantRepository.create({
      workoutId,
      userId: addParticipantDto.userId,
      role: addParticipantDto.role,
      gymId: addParticipantDto.gymId,
    });

    return await this.workoutParticipantRepository.save(participant);
  }

  /**
   * Removes a participant from a workout.
   * TODO: Check friendship status and permissions before allowing removal
   * @param workoutId - The UUID of the workout
   * @param userId - The UUID of the user to remove as a participant
   * @returns Promise<void>
   * @throws NotFoundException if workout or participant doesn't exist
   */
  async removeParticipant(workoutId: string, userId: string): Promise<void> {
    await this.findOneOrFail(workoutId);

    // TODO: Check friendship status and permissions before allowing removal
    // Verify that:
    // 1. The requester is the workout creator (can remove anyone except owner)
    // 2. The requester is removing themselves
    // 3. Cannot remove the workout owner

    const participant = await this.workoutParticipantRepository.findOne({
      where: {
        workoutId,
        userId,
      },
    });

    if (!participant) {
      throw new NotFoundException(
        `Participant with user ID ${userId} not found in workout ${workoutId}`,
      );
    }

    // Mark the participant as having left
    participant.leftAt = new Date();
    await this.workoutParticipantRepository.save(participant);
  }

  /**
   * Adds a set to a workout exercise.
   * @param workoutId - The UUID of the workout
   * @param workoutExerciseId - The UUID of the workout exercise
   * @param addSetDto - The data transfer object containing set information
   * @returns Promise<ExerciseSet> The created set entity
   * @throws NotFoundException if workout or workout exercise doesn't exist
   */
  async addSet(
    workoutId: string,
    workoutExerciseId: string,
    addSetDto: AddSetDto,
  ): Promise<ExerciseSet> {
    await this.findOneOrFail(workoutId);

    const workoutExercise = await this.workoutExerciseRepository.findOne({
      where: {
        id: workoutExerciseId,
        workoutId,
      },
    });

    if (!workoutExercise) {
      throw new NotFoundException(
        `Exercise with ID ${workoutExerciseId} not found in workout ${workoutId}`,
      );
    }

    // Check if set number already exists for this performer
    const existingSet = await this.exerciseSetRepository.findOne({
      where: {
        workoutExerciseId,
        performedById: addSetDto.performedById,
        setNumber: addSetDto.setNumber,
      },
    });

    if (existingSet) {
      throw new BadRequestException(
        `Set number ${addSetDto.setNumber} already exists for this user on this exercise`,
      );
    }

    const set = this.exerciseSetRepository.create({
      workoutExerciseId,
      ...addSetDto,
    });

    return await this.exerciseSetRepository.save(set);
  }

  /**
   * Removes a set from a workout exercise.
   * @param workoutId - The UUID of the workout
   * @param workoutExerciseId - The UUID of the workout exercise
   * @param setId - The UUID of the set to remove
   * @returns Promise<void>
   * @throws NotFoundException if workout, exercise, or set doesn't exist
   */
  async removeSet(
    workoutId: string,
    workoutExerciseId: string,
    setId: string,
  ): Promise<void> {
    await this.findOneOrFail(workoutId);

    const workoutExercise = await this.workoutExerciseRepository.findOne({
      where: {
        id: workoutExerciseId,
        workoutId,
      },
    });

    if (!workoutExercise) {
      throw new NotFoundException(
        `Exercise with ID ${workoutExerciseId} not found in workout ${workoutId}`,
      );
    }

    const set = await this.exerciseSetRepository.findOne({
      where: {
        id: setId,
        workoutExerciseId,
      },
    });

    if (!set) {
      throw new NotFoundException(
        `Set with ID ${setId} not found in exercise ${workoutExerciseId}`,
      );
    }

    await this.exerciseSetRepository.remove(set);
  }

  /**
   * Retrieves workouts for a user with optional date range filtering.
   * By default, returns upcoming workouts (from today onwards).
   * @param userId - The UUID of the user
   * @param query - Optional query parameters for date filtering
   * @returns Promise<Workout[]> Array of workout entities
   */
  async findAllForUser(
    userId: string,
    query?: WorkoutQueryDto,
  ): Promise<Workout[]> {
    // Determine date range
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startDate = query?.startDate ? new Date(query.startDate) : startOfToday;
    const endDate = query?.endDate ? new Date(query.endDate) : undefined;

    // Build where clause based on date range
    let dateFilter: any;
    if (endDate) {
      // Both start and end date provided - use Between
      dateFilter = Between(startDate, endDate);
    } else {
      // Only start date (or default to today) - use MoreThanOrEqual
      dateFilter = MoreThanOrEqual(startDate);
    }

    return await this.workoutRepository.find({
      where: {
        createdById: userId,
        startedAt: dateFilter,
      },
      relations: ['createdBy', 'participants', 'exercises'],
      order: {
        startedAt: 'ASC',
      },
    });
  }

  /**
   * Deletes a workout and all associated data.
   * TODO: Only allow deletion by the workout creator
   * @param id - The UUID of the workout to delete
   * @returns Promise<void>
   * @throws NotFoundException if workout doesn't exist
   */
  async remove(userId: string, id: string): Promise<void> {
    const workout = await this.findOneOrFail(id);

    if (workout.createdById !== userId) {
      throw new BadRequestException(
        'Only the creator of the workout can delete it',
      );
    }

    // All related entities (participants, exercises, sets) will be automatically
    // deleted due to CASCADE on delete constraints
    await this.workoutRepository.remove(workout);
  }
}
