import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  Min,
} from 'class-validator';
import { SetType } from '../entities/set.entity';

/**
 * Data Transfer Object for adding a set to a workout exercise.
 */
export class AddSetDto {
  /**
   * Participant ID who performed this set.
   * @example "uuid-here"
   */
  @IsNotEmpty()
  @IsUUID()
  participantId: string;

  /**
   * Set number in the exercise sequence.
   * @example 1
   */
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  setNumber: number;

  /**
   * Type of set.
   * @example "working"
   */
  @IsOptional()
  @IsEnum(SetType)
  setType?: SetType;

  /**
   * Number of repetitions.
   * @example 10
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number;

  /**
   * Weight in kilograms.
   * @example 80.5
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  /**
   * Duration in seconds (for time-based exercises).
   * @example 60
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  /**
   * Distance in meters (for cardio exercises).
   * @example 5000
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceMeters?: number;

  /**
   * Rate of Perceived Exertion (1-10 scale).
   * @example 8.5
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  rpe?: number;

  /**
   * Tempo notation (e.g., "3-1-2-0").
   * @example "3-1-2-0"
   */
  @IsOptional()
  @IsString()
  tempo?: string;

  /**
   * Whether this set is a personal record.
   * @example false
   */
  @IsOptional()
  @IsBoolean()
  isPr?: boolean;

  /**
   * Whether the set was completed.
   * @example true
   */
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  /**
   * Additional notes about the set.
   * @example "Felt strong, could have done more"
   */
  @IsOptional()
  @IsString()
  notes?: string;
}
