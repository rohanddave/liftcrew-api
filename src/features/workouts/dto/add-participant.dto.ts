import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ParticipantRole } from '../entities/workout-participant.entity';

/**
 * Data Transfer Object for adding a participant to a workout.
 */
export class AddParticipantDto {
  /**
   * User ID of the participant to add.
   * @example "uuid-here"
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * Role of the participant in the workout.
   * @example "participant"
   */
  @IsOptional()
  @IsEnum(ParticipantRole)
  role?: ParticipantRole;

  /**
   * Optional gym ID where the participant is working out.
   * @example "uuid-here"
   */
  @IsOptional()
  @IsUUID()
  gymId?: string;
}
