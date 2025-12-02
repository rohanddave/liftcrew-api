import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import {
  FirebaseAuthService,
  PhoneAuthDto,
  GoogleAuthDto,
  AppleAuthDto,
} from './firebase-auth.service';

@Controller('firebase-auth')
export class FirebaseAuthController {
  constructor(private readonly firebaseAuthService: FirebaseAuthService) {}

  @Post('phone')
  async authenticateWithPhone(@Body() phoneAuthDto: PhoneAuthDto) {
    return this.firebaseAuthService.verifyPhoneNumber(phoneAuthDto);
  }

  @Post('google')
  async authenticateWithGoogle(@Body() googleAuthDto: GoogleAuthDto) {
    return this.firebaseAuthService.verifyGoogleAuth(googleAuthDto);
  }

  @Post('apple')
  async authenticateWithApple(@Body() appleAuthDto: AppleAuthDto) {
    return this.firebaseAuthService.verifyAppleAuth(appleAuthDto);
  }

  @Post('verify-token')
  async verifyToken(@Body() body: { idToken: string }) {
    return this.firebaseAuthService.verifyIdToken(body.idToken);
  }

  @Post('custom-token')
  async createCustomToken(
    @Body() body: { uid: string; claims?: object },
  ) {
    return {
      customToken: await this.firebaseAuthService.createCustomToken(
        body.uid,
        body.claims,
      ),
    };
  }

  @Get('user/:uid')
  async getUser(@Param('uid') uid: string) {
    return this.firebaseAuthService.getUserByUid(uid);
  }
}
