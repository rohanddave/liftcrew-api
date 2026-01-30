import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { FirebasePushNotificationsService } from './services/firebase-notifications.service';
import { FirebaseSocialTokenValidation } from './firebase-social-token-validation.strategy';

@Module({
  imports: [ConfigModule],
  providers: [
    FirebaseAuthService,
    {
      provide: 'FIREBASE_APP',
      useFactory: (firebaseAuthService: FirebaseAuthService) => {
        return firebaseAuthService.getApp();
      },
      inject: [FirebaseAuthService],
    },
    FirebasePushNotificationsService,
    FirebaseSocialTokenValidation,
  ],
  exports: [FirebaseAuthService, FirebasePushNotificationsService, FirebaseSocialTokenValidation],
})
export class FirebaseModule {}
