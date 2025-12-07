import { IsISO8601, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for querying workouts with date range filters.
 */
export class WorkoutQueryDto {
  /**
   * Start date for filtering workouts (ISO 8601 format).
   * If not provided, defaults to today for upcoming workouts.
   * @example "2025-12-01T00:00:00Z"
   */
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  /**
   * End date for filtering workouts (ISO 8601 format).
   * If not provided, fetches all workouts from startDate onwards.
   * @example "2025-12-31T23:59:59Z"
   */
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
