import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseAuthUser, FirebaseDecodedToken } from '../types';

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
   * Verify any Firebase ID token
   * Useful for verifying custom tokens or tokens from any provider
   */
  async verifyIdToken(idToken: string): Promise<FirebaseDecodedToken> {
    try {
      return await this.app.auth().verifyIdToken(idToken);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string): Promise<FirebaseAuthUser> {
    try {
      return await this.app.auth().getUser(uid);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<FirebaseAuthUser> {
    try {
      return await this.app.auth().getUserByEmail(email);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Get user by phone number
   */
  async getUserByPhoneNumber(phoneNumber: string): Promise<FirebaseAuthUser> {
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
  ): Promise<FirebaseAuthUser> {
    try {
      return await this.app.auth().updateUser(uid, properties);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}
