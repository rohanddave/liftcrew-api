import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/**
 * Singleton Firebase service that initializes the Firebase app once
 * and provides access to it for all Firebase services
 */
@Injectable()
export class FirebaseBase implements OnModuleInit {
  private app: admin.app.App;
  private initialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    if (this.initialized) {
      console.log('Firebase Admin already initialized, skipping...');
      return;
    }

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

      this.initialized = true;
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  }

  /**
   * Get the Firebase app instance
   * @returns Firebase app instance
   */
  getApp(): admin.app.App {
    if (!this.app) {
      throw new Error('Firebase app not initialized');
    }
    return this.app;
  }

  /**
   * Check if Firebase is initialized and ready
   * @returns true if initialized, false otherwise
   */
  isReady(): boolean {
    return this.initialized && !!this.app;
  }
}
