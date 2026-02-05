import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PROTECTED_KEY, IS_PUBLIC_KEY } from 'src/common/decorators';
import { TokenValidationStrategy } from 'src/common/interfaces/token-validation.strategy';
import { getBearerToken } from 'src/common/utils';
import * as jwt from 'jsonwebtoken';
import { UsersService } from 'src/features/users/services/users.service';

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

@Injectable()
export class JWTTokenGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtTokenValidation: JWTTokenValidation,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isProtected = this.reflector.getAllAndOverride<boolean>(
      IS_PROTECTED_KEY,
      [context.getHandler(), context.getClass()],
    );

    // short circuit if route is marked as public
    if (isPublic) return true;

    const authorization = request.headers.authorization;

    try {
      // Extract the bearer token from authorization header
      const token = getBearerToken(authorization);

      // Validate the JWT token
      const isValid = await this.jwtTokenValidation.validate(token);

      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired JWT token');
      }

      // Decode the JWT token
      const decoded = await this.jwtTokenValidation.validateAndDecode(token);

      if (!decoded) {
        throw new UnauthorizedException('Invalid JWT token');
      }

      request.email = decoded.email;

      const user = await this.usersService.findOneByEmail(decoded.email);

      if (!user && !isProtected) {
        throw new UnauthorizedException('User not found in database');
      }

      request.user = user;

      // Return true to allow the request to proceed
      return true;
    } catch (error) {
      // If token extraction or validation fails, throw UnauthorizedException
      throw new UnauthorizedException(
        error.message || 'Invalid authorization token',
      );
    }
  }
}
