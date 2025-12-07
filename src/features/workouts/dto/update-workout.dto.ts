import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
} from 'class-validator';
import { WorkoutStatus } from '../entities/workout.entity';

/**
 * Data Transfer Object for updating an existing workout.
 * All fields are optional to allow partial updates.
 */
export class UpdateWorkoutDto {
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
   * Timestamp when the workout ended.
   * @example "2025-12-07T11:30:00Z"
   */
  @IsOptional()
  @IsISO8601()
  endedAt?: string;

  /**
   * Status of the workout.
   * @example "completed"
   */
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;
}
