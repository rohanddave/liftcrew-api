import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * Data Transfer Object for creating a new user.
 * Contains all required and optional fields for user registration with validation rules.
 */
export class CreateUserDto {
  /**
   * Unique username for the user.
   * Must be unique across the platform.
   * @example "john_doe"
   */
  @IsNotEmpty()
  @IsString()
  username: string;

  /**
   * User's email address.
   * Must be a valid email format and unique across the platform.
   * @example "john.doe@example.com"
   */
  @IsNotEmpty()
  @IsEmail()
  email: string;

  /**
   * Full name of the user.
   * @example "John Doe"
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * User's height in centimeters.
   * @example 175
   */
  @IsNotEmpty()
  @IsNumber()
  height: number;

  /**
   * User's weight in kilograms.
   * @example 70
   */
  @IsNotEmpty()
  @IsNumber()
  weight: number;

  /**
   * User's age in years.
   * @example 25
   */
  @IsNotEmpty()
  @IsNumber()
  age: number;

  /**
   * URL to the user's profile image.
   * Optional field that must be a valid URL if provided.
   * @example "https://example.com/profile/john.jpg"
   */
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  /**
   * UUID of the user's home gym.
   * Optional field representing the gym the user primarily belongs to.
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @IsOptional()
  @IsString()
  homeGymId?: string;
}
