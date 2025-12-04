import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getBearerToken } from 'src/common/utils';
import * as jwt from 'jsonwebtoken';

/**
 * Refresh Token Guard
 * Validates refresh tokens using the JWT_REFRESH_SECRET.
 * This guard should be used specifically for the refresh token endpoint.
 */
@Injectable()
export class RefreshTokenGuard implements CanActivate {
  private readonly refreshSecret: string;
  private readonly issuer = 'liftcrew-api';
  private readonly audience = 'liftcrew-app';

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    this.refreshSecret = secret;
  }

  /**
   * Validates the refresh token and attaches it to the request object.
   * @param context - The execution context
   * @returns Promise<boolean> - True if token is valid, throws UnauthorizedException otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    try {
      // Extract the bearer token from authorization header
      const token = getBearerToken(authorization);

      // Verify the refresh token with expected issuer and audience
      const decoded = jwt.verify(token, this.refreshSecret, {
        issuer: this.issuer,
        audience: this.audience,
      });

      // Attach the decoded payload to the request object
      request.user = decoded;

      // Attach the token to the request object for use in the controller
      request.token = token;

      // Return true to allow the request to proceed
      return true;
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generic error handling
      throw new UnauthorizedException(
        error.message || 'Invalid refresh token',
      );
    }
  }
}
