import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { TokenValidationStrategy } from '../../common/types/token-validation.strategy';

/**
 * JWT Token Validation Strategy
 * Validates application-specific JWT tokens
 */
@Injectable()
export class JWTTokenValidation implements TokenValidationStrategy {
  constructor(private configService: ConfigService) {}

  /**
   * Validates a JWT token
   * @param token - The JWT token to validate
   * @returns Promise<boolean> - True if token is valid and not expired, false otherwise
   */
  async validate(token: string): Promise<boolean> {
    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');

      if (!jwtSecret) {
        console.error('JWT_SECRET is not configured');
        return false;
      }

      // Verify the token with expected issuer and audience
      jwt.verify(token, jwtSecret, {
        issuer: 'liftcrew-api',
        audience: 'liftcrew-app',
      });

      return true;
    } catch (error) {
      // Token is invalid, expired, or verification failed
      if (error.name === 'TokenExpiredError') {
        console.log('JWT token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        console.log('JWT token is invalid:', error.message);
      } else {
        console.error('JWT validation error:', error.message);
      }

      return false;
    }
  }

  /**
   * Validates and decodes a JWT token
   * @param token - The JWT token to validate and decode
   * @returns Promise<any | null> - Decoded payload if valid, null otherwise
   */
  async validateAndDecode(token: string): Promise<any | null> {
    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');

      if (!jwtSecret) {
        console.error('JWT_SECRET is not configured');
        return null;
      }

      const decoded = jwt.verify(token, jwtSecret, {
        issuer: 'liftcrew-api',
        audience: 'liftcrew-app',
      });

      return decoded;
    } catch (error) {
      return null;
    }
  }
}
