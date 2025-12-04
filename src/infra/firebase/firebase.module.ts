import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { FirebaseSocialTokenValidation } from './firebase-social-token-validation.strategy';

@Module({
  imports: [ConfigModule],
  providers: [FirebaseAuthService, FirebaseSocialTokenValidation],
  exports: [FirebaseAuthService, FirebaseSocialTokenValidation],
})
export class FirebaseModule {}
