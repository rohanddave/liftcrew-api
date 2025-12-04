import { IsString } from 'class-validator';

export class CreateFollowRelationDto {
  @IsString()
  followerId: string;

  @IsString()
  followeeId: string;
}
