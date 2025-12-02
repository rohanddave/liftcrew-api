/**
 * Token validation strategy interface
 * Defines the contract for validating authentication tokens
 */
export interface TokenValidationStrategy {
  /**
   * Validates a token
   * @param token - The token to validate
   * @returns Promise<boolean> - True if token is valid, false otherwise
   */
  validate(token: string): Promise<boolean>;
}
