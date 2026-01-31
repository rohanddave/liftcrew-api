import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { FirebaseSocialTokenValidation } from './firebase-social-token-validation.strategy';
import { FirebasePushNotificationsService } from './services/firebase-notifications.service';
import { FirebaseBase } from './services/firebase-base';

@Module({
  imports: [ConfigModule],
  providers: [
    FirebaseAuthService,
    FirebasePushNotificationsService,
    FirebaseSocialTokenValidation,
    FirebaseBase,
  ],
  exports: [
    FirebaseAuthService,
    FirebasePushNotificationsService,
    FirebaseSocialTokenValidation,
  ],
})
export class FirebaseModule {}
