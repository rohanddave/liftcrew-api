import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { getBearerToken } from '../utils/auth.utils';
import { JWTTokenValidation } from 'src/features/auth/jwt-token-validation.strategy';

@Injectable()
export class JWTTokenGuard implements CanActivate {
  constructor(private readonly jwtTokenValidation: JWTTokenValidation) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    try {
      // Extract the bearer token from authorization header
      const token = getBearerToken(authorization);

      // Validate the JWT token
      const isValid = await this.jwtTokenValidation.validate(token);

      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired JWT token');
      }

      // Optionally decode and attach the payload to request
      const decoded = await this.jwtTokenValidation.validateAndDecode(token);
      if (decoded) {
        request.user = decoded;
      }

      // Attach the token to the request object for use in controllers
      request.jwtToken = token;

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
