import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ExerciseCategory, EquipmentType } from '../entities/exercise.entity';

/**
 * Data Transfer Object for creating a new exercise.
 * Contains all required fields for exercise creation with validation rules.
 */
export class CreateExerciseDto {
  /**
   * The name of the exercise.
   * @example "Barbell Bench Press"
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * A description of how to perform the exercise.
   * @example "Lie on a flat bench and press the barbell up from chest level"
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * The category of the exercise.
   * @example "compound"
   */
  @IsNotEmpty()
  @IsEnum(ExerciseCategory)
  category: ExerciseCategory;

  /**
   * The type of equipment required for the exercise.
   * @example "barbell"
   */
  @IsOptional()
  @IsEnum(EquipmentType)
  equipmentType?: EquipmentType;

  /**
   * Array of muscle group IDs that this exercise targets.
   * @example ["uuid-1", "uuid-2"]
   */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  muscleGroupIds?: string[];
}
