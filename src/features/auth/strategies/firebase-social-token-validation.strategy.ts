import { Injectable } from '@nestjs/common';
import { TokenValidationStrategy } from './token-validation.strategy';
import { FirebaseAuthService } from '../../../infra/firebase/firebase-auth.service';

/**
 * Firebase Social Token Validation Strategy
 * Validates Firebase authentication tokens from social providers
 */
@Injectable()
export class FirebaseSocialTokenValidation implements TokenValidationStrategy {
  constructor(private firebaseAuthService: FirebaseAuthService) {}

  /**
   * Validates a Firebase social authentication token
   * @param token - The Firebase ID token to validate
   * @returns Promise<boolean> - True if token is valid, false otherwise
   */
  async validate(token: string): Promise<boolean> {
    try {
      // Use Firebase Auth Service to verify the token
      await this.firebaseAuthService.verifyIdToken(token);

      return true;
    } catch (error) {
      // Token is invalid, expired, or verification failed
      console.log('Firebase token validation failed:', error.message);
      return false;
    }
  }

  /**
   * Validates and decodes a Firebase social authentication token
   * @param token - The Firebase ID token to validate and decode
   * @returns Promise<any | null> - Decoded token payload if valid, null otherwise
   */
  async validateAndDecode(token: string): Promise<any | null> {
    try {
      const decodedToken = await this.firebaseAuthService.verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      console.log('Firebase token validation failed:', error.message);
      return null;
    }
  }

  /**
   * Validates token and retrieves user information
   * @param token - The Firebase ID token to validate
   * @returns Promise<any | null> - User information if valid, null otherwise
   */
  async validateAndGetUser(token: string): Promise<any | null> {
    try {
      const decodedToken = await this.firebaseAuthService.verifyIdToken(token);

      // Get user details from Firebase
      const userRecord = await this.firebaseAuthService.getUserByUid(
        decodedToken.uid,
      );

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        phoneNumber: userRecord.phoneNumber,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
        },
      };
    } catch (error) {
      console.log(
        'Firebase token validation or user fetch failed:',
        error.message,
      );
      return null;
    }
  }
}
