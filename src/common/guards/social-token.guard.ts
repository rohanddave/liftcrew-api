import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { getBearerToken } from '../utils/auth.utils';

@Injectable()
export class SocialTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    try {
      // Extract the bearer token from authorization header
      const token = getBearerToken(authorization);

      // Attach the token to the request object for use in controllers
      request.socialToken = token;

      // Return true to allow the request to proceed
      return true;
    } catch (error) {
      // If token extraction fails, throw UnauthorizedException
      throw new UnauthorizedException(
        error.message || 'Invalid authorization token',
      );
    }
  }
}
