import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { WorkoutStatus } from '../entities/workout.entity';

/**
 * Data Transfer Object for creating a new workout.
 */
export class CreateWorkoutDto {
  /**
   * Optional name for the workout.
   * @example "Morning Chest Day"
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Timestamp when the workout started.
   * @example "2025-12-07T10:00:00Z"
   */
  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  /**
   * Status of the workout.
   * @example "in_progress"
   */
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;

  // TODO: remove this and read from the request authenticated user in the controller
  /**
   * User ID of the workout creator.
   * @example "uuid-here"
   */
  @IsNotEmpty()
  @IsUUID()
  createdById: string;
}
