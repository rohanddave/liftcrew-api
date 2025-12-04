import {
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

/**
 * Data Transfer Object for updating an existing user.
 * All fields are optional to allow partial updates of user information.
 */
export class UpdateUserDto {
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
   * URL to the user's profile image.
   * Must be a valid URL if provided.
   * @example "https://example.com/profile/john_new.jpg"
   */
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
