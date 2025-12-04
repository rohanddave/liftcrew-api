import { IsLatLong, IsNotEmpty, IsNumber, IsString } from 'class-validator';

/**
 * Data Transfer Object for creating a new gym.
 * Contains all required fields for gym creation with validation rules.
 */
export class CreateGymDto {
  /**
   * The name of the gym.
   * @example "Gold's Gym Downtown"
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * The physical address of the gym.
   * @example "123 Main St, New York, NY 10001"
   */
  @IsNotEmpty()
  @IsString()
  address: string;

  /**
   * The latitude coordinate of the gym's location.
   * Must be a valid latitude value between -90 and 90.
   * @example 40.7128
   */
  @IsNotEmpty()
  @IsNumber()
  @IsLatLong()
  lat: number;

  /**
   * The longitude coordinate of the gym's location.
   * Must be a valid longitude value between -180 and 180.
   * @example -74.0060
   */
  @IsNotEmpty()
  @IsNumber()
  @IsLatLong()
  lng: number;
}
