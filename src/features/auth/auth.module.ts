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
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Authentication Module
 *
 * Handles all authentication-related functionality including:
 * - Firebase token exchange for application JWT tokens
 * - Access token and refresh token generation
 * - Token refresh mechanism
 * - User logout
 *
 * Exports:
 * - JWTTokenGuard: Global guard for protecting routes with JWT authentication
 *
 * Dependencies:
 * - ConfigModule: For environment configuration
 * - FirebaseModule: For Firebase authentication integration
 * - UsersModule: For user data access
 * - TypeORM: For refresh token persistence
 */
@Module({
  imports: [
    ConfigModule,
    FirebaseModule,
    TypeOrmModule.forFeature([RefreshToken]),
    UsersModule.register({ searchProvider: 'relational' }),
    // TODO: remove this depdenency and use event emitter to remove tokens on logout
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JWTTokenGuard, JWTTokenValidation],
  exports: [JWTTokenGuard],
})
export class AuthModule {}
