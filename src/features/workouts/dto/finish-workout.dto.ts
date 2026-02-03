import { IsOptional, IsDateString } from 'class-validator';

export class FinishWorkoutDto {
  @IsOptional()
  @IsDateString()
  finishedAt?: string;
}
