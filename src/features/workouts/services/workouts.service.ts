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
    private readonly usersService: UsersService,
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
    const workout = await this.workoutRepository.save({
      ...createWorkoutDto,
      createdById,
    });

    // adding creator as participant
    const user = await this.usersService.findOneOrFail(createdById);
    const result = await this.workoutParticipantRepository.save({
      workoutId: workout.id,
      userId: createdById,
      role: ParticipantRole.OWNER,
      gymId: user.homeGymId,
    });

    return this.workoutParticipantRepository.findOne({
      where: { id: result.id },
      relations: { user: true, gym: true, workout: true },
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
      relations: [
        'createdBy',
        'participants',
        'exercises',
        'exercises.exercise',
        'exercises.sets',
      ],
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
    await this.verifyWorkoutNotFinishedByParticipant(id, userId);

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
  async addExercise(
    workoutId: string,
    addWorkoutExerciseDto: AddWorkoutExerciseDto,
    userId: string,
  ): Promise<WorkoutExercise> {
    await this.findOneOrFail(workoutId);

    // Verify workout is not finished
    await this.verifyWorkoutNotFinishedByParticipant(workoutId, userId);

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
    userId: string,
  ): Promise<void> {
    await this.findOneOrFail(workoutId);

    // Verify workout is not finished
    await this.verifyWorkoutNotFinishedByParticipant(workoutId, userId);

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

    // Verify workout is not finished
    await this.verifyWorkoutNotFinishedByParticipant(workoutId, userId);

    const user = await this.usersService.findOneOrFail(userId);

    const existingParticipants = await this.workoutParticipantRepository.find({
      where: { workoutId },
    });

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

    return await this.workoutParticipantRepository.save({
      workoutId,
      userId,
      role: addParticipantDto.role,
      gymId: addParticipantDto.gymId ?? user.homeGymId, // default to user's home gym
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
    await this.findOneOrFail(workoutId);

    // Verify workout is not finished
    await this.verifyWorkoutNotFinishedByParticipant(workoutId, userId);

    await this.usersService.findOneOrFail(userId);

    const participant = await this.workoutParticipantRepository.findOne({
      where: { workoutId, userId },
    });

    if (!participant) {
      throw new NotFoundException(
        `Participant with user ID ${userId} not found in workout ${workoutId}`,
      );
    }

    // remove the leaving participant
    await this.workoutParticipantRepository.remove(participant);
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
    await this.usersService.findOneOrFail(userId);

    // Verify workout is not finished
    await this.verifyWorkoutNotFinishedByParticipant(workoutId, userId);

    const participant = await this.workoutParticipantRepository.findOne({
      where: { workoutId, userId },
    });

    if (!participant) {
      throw new NotFoundException(
        `Participant with user ID ${userId} not found in workout ${workoutId}`,
      );
    }

    // Apply updates
    Object.assign(participant, updateParticipantDto);

    // Save and return the updated participant
    return await this.workoutParticipantRepository.save(participant);
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
    // Verify workout exists
    await this.findOneOrFail(workoutId);

    // Get the participant
    const participant = await this.workoutParticipantRepository.findOne({
      where: { workoutId, userId },
    });

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
    const exerciseCount = await this.workoutExerciseRepository.count({
      where: { workoutId },
    });

    if (exerciseCount === 0) {
      throw new BadRequestException(
        'Cannot finish workout: at least one exercise must be tracked',
      );
    }

    // Update the finishedAt timestamp
    participant.finishedAt = finishedAt;

    // Save and return the updated participant
    return await this.workoutParticipantRepository.save(participant);
  }

  /**
   * Checks if a workout has been finished by any participant.
   * @param workoutId - The UUID of the workout
   * @returns Promise<boolean> True if any participant has finished, false otherwise
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
    const participant = await this.workoutParticipantRepository.findOne({
      where: { workoutId, userId },
      relations: { user: true, gym: true, sets: true },
    });

    return participant;
  }

  /**
   * Gets all participants of a workout with their user and gym information.
   * @param workoutId - The UUID of the workout
   * @returns Promise<WorkoutParticipant[]> Array of participants with relations
   */
  async getAllParticipants(workoutId: string): Promise<WorkoutParticipant[]> {
    const participants = await this.workoutParticipantRepository.find({
      where: { workoutId },
      relations: { user: true, gym: true },
      order: { joinedAt: 'ASC' },
    });

    return participants;
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

    // Verify workout is not finished
    await this.verifyWorkoutNotFinishedByParticipant(
      workoutId,
      addSetDto.participantId,
    );

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

    // Verify participant exists and belongs to this workout
    const participant = await this.workoutParticipantRepository.findOne({
      where: {
        id: addSetDto.participantId,
        workoutId,
      },
    });

    if (!participant) {
      throw new NotFoundException(
        `Participant ${addSetDto.participantId} not found in workout ${workoutId}`,
      );
    }

    // Check if set number already exists for this participant
    const existingSet = await this.exerciseSetRepository.findOne({
      where: {
        workoutExerciseId,
        participantId: addSetDto.participantId,
        setNumber: addSetDto.setNumber,
      },
    });

    if (existingSet) {
      throw new BadRequestException(
        `Set number ${addSetDto.setNumber} already exists for this participant on this exercise`,
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
    userId: string,
  ): Promise<void> {
    await this.findOneOrFail(workoutId);

    // Verify workout is not finished
    await this.verifyWorkoutNotFinishedByParticipant(workoutId, userId);

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

    // return participations.map((p) => {
    //   const status = this.computeWorkoutStatus(p.startAt, p.finishedAt, now);
    //   return {
    //     ...p.workout,
    //     status,
    //   };
    // });
  }

  /**
   * Computes the status of a workout based on startAt and finishedAt timestamps
   * @param startAt - When the workout was scheduled to start
   * @param finishedAt - When the workout was finished (nullable)
   * @param now - Current timestamp for comparison
   * @returns WorkoutParticipationStatus
   */
  // private computeWorkoutStatus(
  //   startAt: Date,
  //   finishedAt: Date | null,
  //   now: Date,
  // ): WorkoutParticipationStatus {
  //   // If startAt is in the future, it's scheduled
  //   if (startAt > now) {
  //     return WorkoutParticipationStatus.SCHEDULED;
  //   }

  //   // If startAt has passed and finishedAt is set, it's finished
  //   if (finishedAt) {
  //     return WorkoutParticipationStatus.FINISHED;
  //   }

  //   // If startAt has passed and finishedAt is not set, it's missed
  //   return WorkoutParticipationStatus.MISSED;
  // }

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
