import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseSocialTokenValidation } from './firebase-social-token-validation.strategy';
import { SocialTokenGuard } from 'src/common/guards';

@Module({
  imports: [ConfigModule],
  providers: [
    FirebaseAuthService,
    FirebaseSocialTokenValidation,
    SocialTokenGuard,
  ],
  exports: [
    FirebaseAuthService,
    FirebaseSocialTokenValidation,
    SocialTokenGuard,
  ],
})
export class FirebaseModule {}
