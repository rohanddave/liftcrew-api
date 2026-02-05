import { Controller, Post, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SocialTokenGuard } from 'src/features/auth/guards/social-token.guard';
import { RefreshTokenGuard } from 'src/features/auth/guards/refresh-token.guard';
import {
  RequestWithToken,
  RequestWithTokenAndEmail,
  RequestWithUser,
} from 'src/common/types/request.type';
import { TokenService } from '../services/token.service';
import { Protected, Public } from 'src/common/decorators';
import { UsersService } from 'src/features/users/services/users.service';

/**
 * Controller for authentication-related operations.
 * Handles token exchange, refresh, and logout functionality.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  @Protected()
  @Get('login')
  async login(@Req() req: RequestWithTokenAndEmail) {
    const user = await this.usersService.findOneByEmail(req.email);
    const response = { isNewUser: !user };
    return response;
  }

  /**
   * Refreshes an access token using a valid refresh token.
   * This endpoint is marked as @Public() to bypass the global JWT guard,
   * and uses RefreshTokenGuard to validate refresh tokens specifically.
   * @param req - Request object containing the refresh token
   * @returns Promise containing the new access_token
   */
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refreshToken(@Req() req: RequestWithToken) {
    return this.tokenService.refreshToken(req.token);
  }

  /**
   * Exchanges a Firebase ID token for application JWT tokens.
   * This is a public endpoint that uses SocialTokenGuard to validate Firebase tokens.
   * @param req - Request object containing the Firebase token
   * @returns Promise containing access_token and refresh_token
   */
  @Public()
  @Post('exchange')
  @UseGuards(SocialTokenGuard)
  async exchangeToken(@Req() req: RequestWithToken) {
    return this.tokenService.exchangeFirebaseToken(req.token);
  }

  /**
   * Logs out the authenticated user.
   * Requires a valid JWT access token (uses global JWT guard).
   * @param req - Request object containing authenticated user information
   * @returns Promise with logout result
   */
  @Post('logout')
  logout(@Req() req: RequestWithUser) {
    const { user } = req;
    return this.authService.logout(user);
  }
}
