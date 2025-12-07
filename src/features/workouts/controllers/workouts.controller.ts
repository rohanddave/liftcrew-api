import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkoutsService } from '../services/workouts.service';
import { CreateWorkoutDto } from '../dto/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/update-workout.dto';
import { AddWorkoutExerciseDto } from '../dto/add-workout-exercise.dto';
import { AddParticipantDto } from '../dto/add-participant.dto';
import { AddSetDto } from '../dto/add-set.dto';

/**
 * Controller for managing workout-related operations.
 * Handles CRUD operations for workouts and management of participants, exercises, and sets.
 */
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  /**
   * Retrieves all workouts from the database.
   * @returns Promise<Workout[]> Array of all workout entities
   */
  @Get()
  findAll() {
    return this.workoutsService.findAll();
  }

  /**
   * Retrieves a single workout by its ID.
   * @param id - The UUID of the workout to retrieve
   * @returns Promise<Workout> The workout entity with all relations
   * @throws NotFoundException if workout with given ID is not found
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workoutsService.findOneOrFail(id);
  }

  /**
   * Creates a new workout in the database.
   * @param createWorkoutDto - The data transfer object containing workout details
   * @returns Promise<Workout> The newly created workout entity
   */
  @Post()
  create(@Body() createWorkoutDto: CreateWorkoutDto) {
    return this.workoutsService.create(createWorkoutDto);
  }

  /**
   * Updates an existing workout's information.
   * @param id - The UUID of the workout to update
   * @param updateWorkoutDto - The data transfer object containing updated workout details
   * @returns Promise<Workout> The updated workout entity
   * @throws NotFoundException if workout with given ID is not found
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() updateWorkoutDto: UpdateWorkoutDto) {
    return this.workoutsService.update(id, updateWorkoutDto);
  }

  /**
   * Deletes a workout from the database.
   * TODO: Only allow deletion by the workout creator
   * @param id - The UUID of the workout to delete
   * @returns Promise<void>
   * @throws NotFoundException if workout with given ID is not found
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.workoutsService.remove(id);
  }

  // ==================== Participant Management ====================

  /**
   * Adds a participant to a workout.
   * TODO: Check friendship status before allowing participant to be added
   * @param workoutId - The UUID of the workout
   * @param addParticipantDto - The data transfer object containing participant information
   * @returns Promise<WorkoutParticipant> The created participant entity
   * @throws NotFoundException if workout doesn't exist
   * @throws BadRequestException if participant already exists
   */
  @Post(':id/participants')
  addParticipant(
    @Param('id') workoutId: string,
    @Body() addParticipantDto: AddParticipantDto,
  ) {
    return this.workoutsService.addParticipant(workoutId, addParticipantDto);
  }

  /**
   * Removes a participant from a workout.
   * TODO: Check friendship status and permissions before allowing removal
   * @param workoutId - The UUID of the workout
   * @param userId - The UUID of the user to remove as a participant
   * @returns Promise<void>
   * @throws NotFoundException if workout or participant doesn't exist
   */
  @Delete(':id/participants/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeParticipant(
    @Param('id') workoutId: string,
    @Param('userId') userId: string,
  ) {
    return this.workoutsService.removeParticipant(workoutId, userId);
  }

  // ==================== Exercise Management ====================

  /**
   * Adds an exercise with optional sets to a workout.
   * @param workoutId - The UUID of the workout
   * @param addWorkoutExerciseDto - The data transfer object containing exercise and set information
   * @returns Promise<WorkoutExercise> The created workout exercise with sets
   * @throws NotFoundException if workout doesn't exist
   * @throws BadRequestException if order index is already taken
   */
  @Post(':id/exercises')
  addExercise(
    @Param('id') workoutId: string,
    @Body() addWorkoutExerciseDto: AddWorkoutExerciseDto,
  ) {
    return this.workoutsService.addExerciseWithSets(workoutId, addWorkoutExerciseDto);
  }

  /**
   * Removes an exercise and all its sets from a workout.
   * @param workoutId - The UUID of the workout
   * @param exerciseId - The UUID of the workout exercise to remove
   * @returns Promise<void>
   * @throws NotFoundException if workout or exercise doesn't exist
   */
  @Delete(':id/exercises/:exerciseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeExercise(
    @Param('id') workoutId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.workoutsService.removeExerciseWithSets(workoutId, exerciseId);
  }

  // ==================== Set Management ====================

  /**
   * Adds a set to a workout exercise.
   * @param workoutId - The UUID of the workout
   * @param exerciseId - The UUID of the workout exercise
   * @param addSetDto - The data transfer object containing set information
   * @returns Promise<ExerciseSet> The created set entity
   * @throws NotFoundException if workout or exercise doesn't exist
   * @throws BadRequestException if set number already exists for this user
   */
  @Post(':id/exercises/:exerciseId/sets')
  addSet(
    @Param('id') workoutId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() addSetDto: AddSetDto,
  ) {
    return this.workoutsService.addSet(workoutId, exerciseId, addSetDto);
  }

  /**
   * Removes a set from a workout exercise.
   * @param workoutId - The UUID of the workout
   * @param exerciseId - The UUID of the workout exercise
   * @param setId - The UUID of the set to remove
   * @returns Promise<void>
   * @throws NotFoundException if workout, exercise, or set doesn't exist
   */
  @Delete(':id/exercises/:exerciseId/sets/:setId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSet(
    @Param('id') workoutId: string,
    @Param('exerciseId') exerciseId: string,
    @Param('setId') setId: string,
  ) {
    return this.workoutsService.removeSet(workoutId, exerciseId, setId);
  }
}
