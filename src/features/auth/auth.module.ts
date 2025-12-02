import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseModule } from '../../infra/firebase/firebase.module';
import { SocialTokenGuard } from '../../common/guards';

@Module({
  imports: [ConfigModule, FirebaseModule],
  controllers: [AuthController],
  providers: [AuthService, SocialTokenGuard],
  exports: [AuthService, SocialTokenGuard],
})
export class AuthModule {}
