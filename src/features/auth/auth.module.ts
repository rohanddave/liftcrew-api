import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { FirebaseModule } from '../../infra/firebase/firebase.module';
import { JWTTokenGuard, JWTTokenValidation } from './guards/jwt-token.guard';
import { TokenService } from './services/token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-tokens.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    FirebaseModule,
    TypeOrmModule.forFeature([RefreshToken]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JWTTokenGuard, JWTTokenValidation],
  exports: [JWTTokenGuard],
})
export class AuthModule {}
