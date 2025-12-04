import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthService } from '../../../infra/firebase/services/firebase-auth.service';
import * as jwt from 'jsonwebtoken';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpirySeconds: number;
  private readonly issuer = 'liftcrew-api';
  private readonly audience = 'liftcrew-app';
  constructor(
    private firebaseAuthService: FirebaseAuthService,
    private configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    this.jwtSecret = secret;

    const expiry = this.configService.get<number>('JWT_EXPIRY_SECONDS', 604800); // Default to 7 days
    this.jwtExpirySeconds = expiry;
  }

  refreshToken(token: string) {
    return {
      access_token: 'new-mock-jwt-token',
    };
  }

  async exchangeFirebaseToken(firebaseToken: string) {
    // Verify the Firebase token
    const decodedToken =
      await this.firebaseAuthService.verifyIdToken(firebaseToken);

    // Extract user information from the decoded token
    const payload = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      phoneNumber: decodedToken.phone_number,
      name: decodedToken.name,
      picture: decodedToken.picture,
      provider: decodedToken.firebase?.sign_in_provider,
      emailVerified: decodedToken.email_verified,
    };

    // Generate application-specific JWT token
    const appToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpirySeconds,
      issuer: this.issuer,
      audience: this.audience,
    });

    return {
      access_token: appToken,
      token_type: 'Bearer',
      expiresIn: this.jwtExpirySeconds,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        phoneNumber: decodedToken.phone_number,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        provider: decodedToken.firebase?.sign_in_provider,
        emailVerified: decodedToken.email_verified,
      },
    };
  }
}
