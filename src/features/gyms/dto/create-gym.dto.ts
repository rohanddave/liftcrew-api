import { IsLatLong, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateGymDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsNumber()
  @IsLatLong()
  lat: number;

  @IsNotEmpty()
  @IsNumber()
  @IsLatLong()
  lng: number;
}
