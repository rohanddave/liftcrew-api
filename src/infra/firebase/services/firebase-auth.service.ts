import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseAuthUser, FirebaseDecodedToken } from '../types';
import { FirebaseBase } from './firebase-base';

@Injectable()
export class FirebaseAuthService {
  constructor(private firebaseBase: FirebaseBase) {}

  /**
   * Verify any Firebase ID token
   * Useful for verifying custom tokens or tokens from any provider
   */
  async verifyIdToken(idToken: string): Promise<FirebaseDecodedToken> {
    try {
      const app = this.firebaseBase.getApp();
      return await app.auth().verifyIdToken(idToken);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string): Promise<FirebaseAuthUser> {
    try {
      const app = this.firebaseBase.getApp();
      return await app.auth().getUser(uid);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<FirebaseAuthUser> {
    try {
      const app = this.firebaseBase.getApp();
      return await app.auth().getUserByEmail(email);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Get user by phone number
   */
  async getUserByPhoneNumber(phoneNumber: string): Promise<FirebaseAuthUser> {
    try {
      const app = this.firebaseBase.getApp();
      return await app.auth().getUserByPhoneNumber(phoneNumber);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      const app = this.firebaseBase.getApp();
      await app.auth().deleteUser(uid);
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
      const app = this.firebaseBase.getApp();
      return await app.auth().updateUser(uid, properties);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Get the Firebase app instance
   * Used by other Firebase services (e.g., messaging)
   */
  getApp(): admin.app.App {
    return this.firebaseBase.getApp();
  }

  /**
   * Check if Firebase is initialized and ready
   */
  isReady(): boolean {
    return this.firebaseBase.isReady();
  }
}
