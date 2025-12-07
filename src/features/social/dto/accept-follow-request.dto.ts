import { IsString } from 'class-validator';

export class AcceptFollowRequestDto {
  @IsString()
  followerId: string;
}
