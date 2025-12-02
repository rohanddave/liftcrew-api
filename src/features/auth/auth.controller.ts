import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SocialTokenGuard } from 'src/common/guards';

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
  @UseGuards(SocialTokenGuard)
  async exchangeToken(@Req() req: { socialToken: string }) {
    return this.authService.exchangeFirebaseToken(req.socialToken);
  }
}
