import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Data Transfer Object for updating an existing gym.
 * All fields are optional to allow partial updates.
 */
export class UpdateGymDto {
  /**
   * The name of the gym.
   * @example "Gold's Gym Downtown"
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * The physical address of the gym.
   * @example "123 Main St, New York, NY 10001"
   */
  @IsOptional()
  @IsString()
  address?: string;

  /**
   * The latitude coordinate of the gym's location.
   * Must be a valid latitude value between -90 and 90.
   * @example 40.7128
   */
  @IsOptional()
  @IsNumber()
  lat?: number;

  /**
   * The longitude coordinate of the gym's location.
   * Must be a valid longitude value between -180 and 180.
   * @example -74.0060
   */
  @IsOptional()
  @IsNumber()
  lng?: number;
}
