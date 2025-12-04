import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseSocialTokenValidation } from '../../../infra/firebase/firebase-social-token-validation.strategy';
import { getBearerToken } from 'src/common/utils';

@Injectable()
export class SocialTokenGuard implements CanActivate {
  constructor(
    private readonly firebaseSocialTokenValidation: FirebaseSocialTokenValidation,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    try {
      // Extract the bearer token from authorization header
      const token = getBearerToken(authorization);

      // Validate the Firebase token
      const isValid = await this.firebaseSocialTokenValidation.validate(token);

      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired Firebase token');
      }

      // Attach the token to the request object for use in controllers
      request.token = token;

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
