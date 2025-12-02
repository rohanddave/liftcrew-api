import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() credentials: any) {
    return this.authService.login(credentials);
  }

  @Post('register')
  register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  refreshToken(@Body() body: { token: string }) {
    return this.authService.refreshToken(body.token);
  }
}
