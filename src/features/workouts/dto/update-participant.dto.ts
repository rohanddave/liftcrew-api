import { IsOptional, IsISO8601, IsEnum, IsUUID } from 'class-validator';
import { ParticipantRole } from '../entities/workout-participant.entity';

/**
 * Data Transfer Object for updating a workout participant.
 * All fields are optional to allow partial updates.
 */
export class UpdateParticipantDto {
  /**
   * When the participant started their workout.
   * @example "2024-01-15T10:30:00Z"
   */
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  /**
   * When the participant finished their workout.
   * @example "2024-01-15T12:00:00Z"
   */
  @IsOptional()
  @IsISO8601()
  finishedAt?: string;

  /**
   * The participant's role in the workout.
   * @example "participant"
   */
  @IsOptional()
  @IsEnum(ParticipantRole)
  role?: ParticipantRole;

  /**
   * UUID of the gym where the participant is working out.
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsOptional()
  @IsUUID()
  gymId?: string;
}
