import { IsOptional, IsString } from 'class-validator';

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
}
