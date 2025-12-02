import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthService } from '../../infra/firebase/firebase-auth.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private firebaseAuthService: FirebaseAuthService,
    private configService: ConfigService,
  ) {}

  login(credentials: any) {
    return {
      access_token: 'mock-jwt-token',
      user: { id: '1', email: credentials.email },
    };
  }

  validateUser(email: string, password: string) {
    return { id: '1', email };
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

    // Get JWT secret from environment
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Generate application-specific JWT token
    const appToken = jwt.sign(payload, jwtSecret, {
      expiresIn: '7d', // Token expires in 7 days
      issuer: 'liftcrew-api',
      audience: 'liftcrew-app',
    });

    return {
      access_token: appToken,
      token_type: 'Bearer',
      expires_in: 604800, // 7 days in seconds
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
