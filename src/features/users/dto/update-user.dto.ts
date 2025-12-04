import { IsEmail, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * Data Transfer Object for updating an existing user.
 * All fields are optional to allow partial updates of user information.
 */
export class UpdateUserDto {
  /**
   * Unique username for the user.
   * Must be unique across the platform if updated.
   * @example "john_doe_updated"
   */
  @IsOptional()
  @IsString()
  username?: string;

  /**
   * User's email address.
   * Must be a valid email format and unique across the platform if updated.
   * @example "john.updated@example.com"
   */
  @IsOptional()
  @IsEmail()
  email?: string;

  /**
   * Full name of the user.
   * @example "John Updated Doe"
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * User's height in centimeters.
   * @example 180
   */
  @IsOptional()
  @IsNumber()
  height?: number;

  /**
   * User's weight in kilograms.
   * @example 75
   */
  @IsOptional()
  @IsNumber()
  weight?: number;

  /**
   * User's age in years.
   * @example 26
   */
  @IsOptional()
  @IsNumber()
  age?: number;

  /**
   * URL to the user's profile image.
   * Must be a valid URL if provided.
   * @example "https://example.com/profile/john_new.jpg"
   */
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  /**
   * UUID of the user's home gym.
   * Represents the gym the user primarily belongs to.
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @IsOptional()
  @IsString()
  homeGymId?: string;
}
