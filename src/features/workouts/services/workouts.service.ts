import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  MoreThanOrEqual,
  LessThanOrEqual,
  Between,
  FindOptionsWhere,
  Equal,
  DataSource,
} from 'typeorm';
import { Workout } from '../entities/workout.entity';
import { WorkoutExercise } from '../entities/workout-exercise.entity';
import { ExerciseSet } from '../entities/set.entity';
import {
  ParticipantRole,
  WorkoutParticipant,
} from '../entities/workout-participant.entity';
import { CreateWorkoutDto } from '../dto/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/update-workout.dto';
import { AddWorkoutExerciseDto } from '../dto/add-workout-exercise.dto';
import { AddParticipantDto } from '../dto/add-participant.dto';
import { UpdateParticipantDto } from '../dto/update-participant.dto';
import { AddSetDto } from '../dto/add-set.dto';
import { WorkoutQueryDto } from '../dto/workout-query.dto';
import { UsersService } from 'src/features/users/services/users.service';
import { Exercise } from '../entities/exercise.entity';

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
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new workout.
   * @param createWorkoutDto - The data transfer object containing workout information
   * @returns Promise<Workout> The newly created workout entity
   */
  async create(
    createdById: string,
    createWorkoutDto: CreateWorkoutDto,
  ): Promise<WorkoutParticipant> {
    // check if user exists
    const user = await this.usersService.findOneOrFail(createdById);

    return this.dataSource.transaction(async (manager) => {
      const workout = await manager.save(Workout, {
        ...createWorkoutDto,
        createdById,
        participantCount: 1,
      });

      const participant = manager.create(WorkoutParticipant, {
        workoutId: workout.id,
        userId: createdById,
        role: ParticipantRole.OWNER,
        gymId: user.homeGymId,
        user,
        workout,
        gym: user.homeGym,
      });

      return manager.save(WorkoutParticipant, participant);
    });
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
      relations: {
        createdBy: true,
        participants: true,
        exercises: {
          exercise: true,
          sets: true,
        },
      },
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
    userId: string,
  ): Promise<Workout> {
    const workout = await this.findOneOrFail(id);

    // Verify workout is not finished
    if (updateWorkoutDto.startedAt || updateWorkoutDto.endedAt) {
      await this.verifyWorkoutNotFinishedByParticipant(id, userId);
    }

    Object.assign(workout, updateWorkoutDto);
    return this.workoutRepository.save(workout);
  }

  /**
   * Adds an exercise with set information to a workout.
   * @param workoutId - The UUID of the workout
   * @param addWorkoutExerciseDto - The data transfer object containing exercise and set information
   * @returns Promise<WorkoutExercise> The created workout exercise with sets
   * @throws NotFoundException if workout doesn't exist
   */
  async addExercise(
    workoutId: string,
    addWorkoutExerciseDto: AddWorkoutExerciseDto,
    userId: string,
  ): Promise<WorkoutExercise> {
    const [workout, existingExercise] = await Promise.all([
      this.findOneOrFail(workoutId),
      this.workoutExerciseRepository.findOne({
        where: {
          workoutId,
          orderIndex: addWorkoutExerciseDto.orderIndex,
        },
      }),
    ]);

    // Verify after fetching workout
    await this.verifyWorkoutNotFinishedByParticipant(workoutId, userId);

    if (existingExercise) {
      throw new BadRequestException(
        `Exercise at order index ${addWorkoutExerciseDto.orderIndex} already exists`,
      );
    }

    // Verify exercise exists
    const exercise = await this.exerciseRepository.findOneBy({
      id: addWorkoutExerciseDto.exerciseId,
    });

    if (!exercise) {
      throw new NotFoundException(
        `Exercise with id ${addWorkoutExerciseDto.exerciseId} not found`,
      );
    }

    // Create the workout exercise
    const workoutExercise = this.workoutExerciseRepository.create({
      workoutId,
      exerciseId: addWorkoutExerciseDto.exerciseId,
      orderIndex: addWorkoutExerciseDto.orderIndex,
      notes: addWorkoutExerciseDto.notes,
      restSeconds: addWorkoutExerciseDto.restSeconds,
      exercise, // Attach to avoid extra query
    });

    const saved = await this.workoutExerciseRepository.save(workoutExercise);
    saved.sets = []; // New exercise has no sets yet
    return saved;
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
    userId: string,
  ): Promise<void> {
    // Parallel reads
    const [workout, workoutExercise] = await Promise.all([
      this.findOneOrFail(workoutId),
      this.workoutExerciseRepository.findOne({
        where: {
          id: workoutExerciseId,
          workoutId,
        },
      }),
    ]);

    if (!workoutExercise) {
      throw new NotFoundException(
        `Exercise with ID ${workoutExerciseId} not found in workout ${workoutId}`,
      );
    }

    await this.verifyWorkoutNotFinishedByParticipant(workoutId, userId);

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
    const [workout, user, existingParticipants] = await Promise.all([
      this.findOneOrFail(workoutId),
      this.usersService.findOneOrFail(userId),
      this.workoutParticipantRepository.find({
        where: { workoutId },
        select: { userId: true },
      }),
    ]);

    if (existingParticipants.length >= this.MAX_PARTICIPANTS_PER_WORKOUT) {
      throw new BadRequestException(
        'Cannot add more participants: workout has reached the maximum limit of 25 participants',
      );
    }

    // Check if participant already exists
    const existingParticipant = existingParticipants.some(
      (participant) => participant.userId === userId,
    );

    if (existingParticipant) {
      throw new BadRequestException(
        `User ${userId} is already a participant in this workout`,
      );
    }

    // Use transaction to ensure consistency
    return this.dataSource.transaction(async (manager) => {
      await manager.increment(
        Workout,
        { id: workoutId },
        'participantCount',
        1,
      );

      const participant = manager.create(WorkoutParticipant, {
        workoutId,
        userId,
        role: addParticipantDto.role,
        gymId: addParticipantDto.gymId ?? user.homeGymId,
        user, // Attach to avoid extra query
      });

      return manager.save(WorkoutParticipant, participant);
    });
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
    const [workout, participant] = await Promise.all([
      this.findOneOrFail(workoutId),
      this.workoutParticipantRepository.findOne({
        where: { workoutId, userId },
        select: { role: true, userId: true },
      }),
    ]);

    if (!participant) {
      throw new NotFoundException(
        `Participant with user ID ${userId} not found in workout ${workoutId}`,
      );
    }

    // Prevent owner from leaving
    if (participant.role === ParticipantRole.OWNER) {
      throw new BadRequestException('Workout owner cannot be removed');
    }

    return this.dataSource.transaction(async (manager) => {
      // remove the leaving participant
      await manager.remove(WorkoutParticipant, participant);

      // Decrement participant count
      await manager.decrement(
        Workout,
        { id: workoutId },
        'participantCount',
        1,
      );
    });
  }

  /**
   * Updates a participant's information in a workout.
   * @param requesterId - The UUID of the user making the request
   * @param workoutId - The UUID of the workout
   * @param userId - The UUID of the participant to update
   * @param updateParticipantDto - The data transfer object containing updated participant information
   * @returns Promise<WorkoutParticipant> The updated participant entity
   * @throws NotFoundException if workout or participant doesn't exist
   * @throws BadRequestException if unauthorized to update
   */
  async updateParticipant(
    workoutId: string,
    userId: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<WorkoutParticipant> {
    const participant = await this.workoutParticipantRepository.findOne({
      where: { workoutId, userId },
    });

    if (!participant) {
      throw new NotFoundException(
        `Participant with user ID ${userId} not found in workout ${workoutId}`,
      );
    }

    if (updateParticipantDto.startAt || updateParticipantDto.finishedAt) {
      await this.verifyWorkoutNotFinishedByParticipant(workoutId, userId);
    }

    // Apply updates
    Object.assign(participant, updateParticipantDto);

    // Save and return the updated participant
    return this.workoutParticipantRepository.save(participant);
  }

  /**
   * Marks a user's workout participation as finished.
   * Validates that at least one exercise has been tracked before allowing completion.
   * Validates that the workout can only be finished on the same day it was scheduled.
   * @param workoutId - The UUID of the workout
   * @param userId - The UUID of the user finishing the workout
   * @param finishedAt - The timestamp when the workout was finished (cannot be in the future)
   * @returns Promise<WorkoutParticipant> The updated participant entity with finishedAt set
   * @throws NotFoundException if workout or participant doesn't exist
   * @throws BadRequestException if no exercises tracked, finishedAt is in the future, or not on the scheduled day
   */
  async finishWorkout(
    workoutId: string,
    userId: string,
    finishedAt: Date,
  ): Promise<WorkoutParticipant> {
    const [participant, exerciseCount] = await Promise.all([
      // Get the participant
      this.workoutParticipantRepository.findOne({
        where: { workoutId, userId },
      }),
      // Count the number of exercises tracked for this workout
      this.workoutExerciseRepository.count({
        where: { workoutId },
      }),
    ]);

    if (!participant) {
      throw new NotFoundException(
        `You are not a participant in workout ${workoutId}`,
      );
    }

    // Validate that finishedAt is not in the future
    const now = new Date();
    if (finishedAt > now) {
      throw new BadRequestException(
        'Cannot finish workout: finishedAt cannot be in the future',
      );
    }

    // Validate that startAt is on the same day as current time
    const startAtDate = new Date(participant.startAt);

    const isSameDay =
      startAtDate.getFullYear() === now.getFullYear() &&
      startAtDate.getMonth() === now.getMonth() &&
      startAtDate.getDate() === now.getDate();

    if (!isSameDay) {
      throw new BadRequestException(
        'Cannot finish workout: workout can only be finished on the day it was scheduled',
      );
    }

    // Check if at least one exercise has been tracked for this workout
    if (exerciseCount === 0) {
      throw new BadRequestException(
        'Cannot finish workout: at least one exercise must be tracked',
      );
    }

    // Update the finishedAt timestamp
    participant.finishedAt = finishedAt;

    // Save and return the updated participant
    return this.workoutParticipantRepository.save(participant);
  }

  /**
   * Checks if a workout has been finished by the participant.
   * @param workoutId - The UUID of the workout
   * @returns Promise<boolean> True if the participant has finished, false otherwise
   */
  private async isWorkoutFinished(
    workoutId: string,
    userId: string,
  ): Promise<boolean> {
    const finishedParticipant = await this.workoutParticipantRepository.findOne(
      {
        where: {
          workoutId,
          userId,
        },
      },
    );

    return !!finishedParticipant?.finishedAt;
  }

  /**
   * Verifies that a workout is not finished.
   * Throws a BadRequestException if any participant has finished the workout.
   * @param workoutId - The UUID of the workout
   * @throws BadRequestException if workout is finished
   */
  private async verifyWorkoutNotFinishedByParticipant(
    workoutId: string,
    participantId: string,
  ): Promise<void> {
    const isFinished = await this.isWorkoutFinished(workoutId, participantId);
    if (isFinished) {
      throw new BadRequestException(
        'Cannot modify workout: workout has already been finished',
      );
    }
  }

  /**
   * Verifies that a user is a participant in a workout.
   * Throws a BadRequestException if the user is not a participant.
   * @param workoutId - The UUID of the workout
   * @param userId - The UUID of the user to verify
   * @throws BadRequestException if user is not a participant
   */
  async verifyUserIsParticipant(
    workoutId: string,
    userId: string,
  ): Promise<void> {
    const participant = await this.workoutParticipantRepository.findOne({
      where: { workoutId, userId },
    });

    if (!participant) {
      throw new BadRequestException(
        'You must be a participant in this workout to perform this action',
      );
    }
  }

  /**
   * Gets the authenticated user's participation in a specific workout.
   * @param workoutId - The UUID of the workout
   * @param userId - The UUID of the authenticated user
   * @returns Promise<WorkoutParticipant | null> The participant record with relations, or null if not participating
   */
  async getMyParticipation(
    workoutId: string,
    userId: string,
  ): Promise<WorkoutParticipant | null> {
    return this.workoutParticipantRepository.findOne({
      where: { workoutId, userId },
      relations: { user: true, gym: true, sets: true },
    });
  }

  /**
   * Gets all participants of a workout with their user and gym information.
   * @param workoutId - The UUID of the workout
   * @returns Promise<WorkoutParticipant[]> Array of participants with relations
   */
  async getAllParticipants(workoutId: string): Promise<WorkoutParticipant[]> {
    return this.workoutParticipantRepository.find({
      where: { workoutId },
      relations: { user: true, gym: true },
      order: { joinedAt: 'ASC' },
    });
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
    const [_, workoutExercise, existingSet] = await Promise.all([
      // Verify workout is not finished
      this.verifyWorkoutNotFinishedByParticipant(
        workoutId,
        addSetDto.participantId,
      ),
      this.workoutExerciseRepository.findOne({
        where: {
          id: workoutExerciseId,
          workoutId,
        },
      }),
      // Check if set number already exists for this participant
      this.exerciseSetRepository.findOne({
        where: {
          workoutExerciseId,
          participantId: addSetDto.participantId,
          setNumber: addSetDto.setNumber,
        },
      }),
    ]);

    if (existingSet) {
      throw new BadRequestException(
        `Set number ${addSetDto.setNumber} already exists for this participant on this exercise`,
      );
    }

    const set = this.exerciseSetRepository.create({
      workoutExerciseId,
      ...addSetDto,
    });

    return this.exerciseSetRepository.save(set);
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
    userId: string,
  ): Promise<void> {
    const [workoutExercise, _, set] = await Promise.all([
      this.workoutExerciseRepository.findOne({
        where: {
          id: workoutExerciseId,
          workoutId,
        },
      }),
      // Verify workout is not finished
      this.verifyWorkoutNotFinishedByParticipant(workoutId, userId),
      this.exerciseSetRepository.findOne({
        where: {
          id: setId,
          workoutExerciseId,
        },
      }),
    ]);

    if (!workoutExercise) {
      throw new NotFoundException(
        `Exercise with ID ${workoutExerciseId} not found in workout ${workoutId}`,
      );
    }

    if (!set) {
      throw new NotFoundException(
        `Set with ID ${setId} not found in exercise ${workoutExerciseId}`,
      );
    }

    await this.exerciseSetRepository.remove(set);
  }

  /**
   * Retrieves workouts for a user with optional date range filtering.
   * If no query parameters provided, returns all workouts.
   * Each workout includes a computed status field based on startAt and finishedAt.
   * @param userId - The UUID of the user
   * @param query - Optional query parameters for date filtering
   * @returns Promise<WorkoutWithStatus[]> Array of workout entities with status
   */
  async findAllForUser(
    userId: string,
    query?: WorkoutQueryDto,
  ): Promise<WorkoutParticipant[]> {
    // Build where clause
    const whereClause: FindOptionsWhere<WorkoutParticipant> = {
      userId: Equal(userId),
    };

    // Only apply date filtering if query params are provided
    if (query?.startDate || query?.endDate) {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      if (startDate && endDate) {
        // Both start and end date provided - use Between
        whereClause.startAt = Between(startDate, endDate);
      } else if (startDate) {
        // Only start date provided - use MoreThanOrEqual
        whereClause.startAt = MoreThanOrEqual(startDate);
      } else if (endDate) {
        // Only end date provided - use LessThanOrEqual
        whereClause.startAt = LessThanOrEqual(endDate);
      }
    }

    const participations = await this.workoutParticipantRepository.find({
      where: whereClause,
      relations: {
        workout: { createdBy: true },
      },
      order: { startAt: 'ASC' },
    });

    return participations;
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
