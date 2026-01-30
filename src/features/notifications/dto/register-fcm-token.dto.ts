import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterFcmTokenDto {
  @IsNotEmpty()
  @IsString()
  fcmToken: string;
}
