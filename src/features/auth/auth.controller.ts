import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() credentials: any) {
    return this.authService.login(credentials);
  }

  @Post('refresh')
  refreshToken(@Body() body: { token: string }) {
    return this.authService.refreshToken(body.token);
  }

  @Post('exchange')
  async exchangeToken(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new BadRequestException('Authorization header is required');
    }

    // Extract token from "Bearer <token>" format
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new BadRequestException(
        'Authorization header must be in format: Bearer <token>',
      );
    }

    const firebaseToken = parts[1];
    return this.authService.exchangeFirebaseToken(firebaseToken);
  }
}
