import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PhoneAuthDto {
  phoneNumber: string;
  verificationCode: string;
}

export interface GoogleAuthDto {
  idToken: string;
}

export interface AppleAuthDto {
  idToken: string;
  nonce?: string;
}

export interface AuthResponse {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  customToken?: string;
}

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
  private app: admin.app.App;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const serviceAccount = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT',
    );

    if (!serviceAccount) {
      console.warn(
        'FIREBASE_SERVICE_ACCOUNT not configured. Firebase services will not be available.',
      );
      return;
    }

    try {
      const serviceAccountJson = JSON.parse(serviceAccount);

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });

      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  }

  /**
   * Verify phone authentication
   * In production, you would verify the phone number with Firebase Auth
   * This requires the client to send the verification code after receiving SMS
   */
  async verifyPhoneNumber(phoneAuthDto: PhoneAuthDto): Promise<AuthResponse> {
    try {
      // In a real implementation, you would verify the phone number with Firebase
      // For now, we'll create/get user by phone number
      let userRecord: admin.auth.UserRecord;

      try {
        userRecord = await this.app
          .auth()
          .getUserByPhoneNumber(phoneAuthDto.phoneNumber);
      } catch (error) {
        // User doesn't exist, create new user
        userRecord = await this.app.auth().createUser({
          phoneNumber: phoneAuthDto.phoneNumber,
        });
      }

      const customToken = await this.app.auth().createCustomToken(userRecord.uid);

      return {
        uid: userRecord.uid,
        phoneNumber: userRecord.phoneNumber,
        displayName: userRecord.displayName,
        customToken,
      };
    } catch (error) {
      throw new Error(`Phone authentication failed: ${error.message}`);
    }
  }

  /**
   * Verify Google authentication token
   * The client sends the Google ID token received from Google Sign-In
   */
  async verifyGoogleAuth(googleAuthDto: GoogleAuthDto): Promise<AuthResponse> {
    try {
      const decodedToken = await this.app
        .auth()
        .verifyIdToken(googleAuthDto.idToken);

      const userRecord = await this.app.auth().getUser(decodedToken.uid);

      const customToken = await this.app.auth().createCustomToken(userRecord.uid);

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        customToken,
      };
    } catch (error) {
      throw new Error(`Google authentication failed: ${error.message}`);
    }
  }

  /**
   * Verify Apple authentication token
   * The client sends the Apple ID token received from Apple Sign-In
   */
  async verifyAppleAuth(appleAuthDto: AppleAuthDto): Promise<AuthResponse> {
    try {
      const decodedToken = await this.app
        .auth()
        .verifyIdToken(appleAuthDto.idToken);

      // Verify nonce if provided (recommended for security)
      if (appleAuthDto.nonce && decodedToken.nonce !== appleAuthDto.nonce) {
        throw new Error('Invalid nonce');
      }

      const userRecord = await this.app.auth().getUser(decodedToken.uid);

      const customToken = await this.app.auth().createCustomToken(userRecord.uid);

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        customToken,
      };
    } catch (error) {
      throw new Error(`Apple authentication failed: ${error.message}`);
    }
  }

  /**
   * Verify any Firebase ID token
   * Useful for verifying custom tokens or tokens from any provider
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.app.auth().verifyIdToken(idToken);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Create a custom token for a user
   * Useful for server-side authentication
   */
  async createCustomToken(
    uid: string,
    additionalClaims?: object,
  ): Promise<string> {
    try {
      return await this.app.auth().createCustomToken(uid, additionalClaims);
    } catch (error) {
      throw new Error(`Failed to create custom token: ${error.message}`);
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.app.auth().getUser(uid);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.app.auth().getUserByEmail(email);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Get user by phone number
   */
  async getUserByPhoneNumber(
    phoneNumber: string,
  ): Promise<admin.auth.UserRecord> {
    try {
      return await this.app.auth().getUserByPhoneNumber(phoneNumber);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.app.auth().deleteUser(uid);
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Update user data
   */
  async updateUser(
    uid: string,
    properties: admin.auth.UpdateRequest,
  ): Promise<admin.auth.UserRecord> {
    try {
      return await this.app.auth().updateUser(uid, properties);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}
