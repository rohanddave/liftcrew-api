import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SocialTokenGuard } from 'src/features/auth/guards/social-token.guard';
import {
  RequestWithToken,
  RequestWithUser,
} from 'src/common/types/request.type';
import { TokenService } from '../services/token.service';
import { Public } from 'src/common/decorators';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('login')
  // TODO: replace any with correct type of credentials
  login(@Body() credentials: any) {
    return this.authService.login(credentials);
  }

  @Post('refresh')
  refreshToken(@Req() req: RequestWithToken) {
    return this.tokenService.refreshToken(req.token);
  }

  @Public()
  @Post('exchange')
  @UseGuards(SocialTokenGuard)
  async exchangeToken(@Req() req: RequestWithToken) {
    return this.tokenService.exchangeFirebaseToken(req.token);
  }

  @Post('logout')
  logout(@Req() req: RequestWithUser) {
    const { user } = req;
    return this.authService.logout(user);
  }
}
