import { IsString } from 'class-validator';

export class RejectFollowRequestDto {
  @IsString()
  followerId: string;
}
