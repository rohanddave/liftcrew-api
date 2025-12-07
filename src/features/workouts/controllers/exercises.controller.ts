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
import { ExercisesService } from '../services/exercises.service';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';

/**
 * Controller for managing exercise-related operations.
 * Handles CRUD operations for exercise entities.
 */
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  /**
   * Retrieves all exercises from the database.
   * @returns Promise<Exercise[]> Array of all exercise entities
   */
  @Get()
  findAll() {
    return this.exercisesService.findAll();
  }

  /**
   * Retrieves a single exercise by its ID.
   * @param id - The UUID of the exercise to retrieve
   * @returns Promise<Exercise> The exercise entity
   * @throws NotFoundException if exercise with given ID is not found
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
  }

  /**
   * Creates a new exercise in the database.
   * @param createExerciseDto - The data transfer object containing exercise details
   * @returns Promise<Exercise> The newly created exercise entity
   */
  @Post()
  create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.create(createExerciseDto);
  }

  /**
   * Updates an existing exercise's information.
   * @param id - The UUID of the exercise to update
   * @param updateExerciseDto - The data transfer object containing updated exercise details
   * @returns Promise<Exercise> The updated exercise entity
   * @throws NotFoundException if exercise with given ID is not found
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() updateExerciseDto: UpdateExerciseDto) {
    return this.exercisesService.update(id, updateExerciseDto);
  }

  /**
   * Deletes an exercise from the database.
   * @param id - The UUID of the exercise to delete
   * @returns Promise<void>
   * @throws NotFoundException if exercise with given ID is not found
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.exercisesService.remove(id);
  }
}
