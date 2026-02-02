import { IsNumber, IsNotEmpty } from 'class-validator';

export class CheckInDto {
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @IsNotEmpty()
  @IsNumber()
  lng: number;
}
