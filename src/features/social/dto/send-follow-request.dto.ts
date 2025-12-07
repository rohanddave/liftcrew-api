import { IsString } from 'class-validator';

export class SendFollowRequestDto {
  @IsString()
  followeeId: string;
}
