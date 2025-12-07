import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { GymsModule } from '../gyms/gyms.module';

/**
 * Users Module
 *
 * Handles all user-related functionality including:
 * - User profile management (CRUD operations)
 * - User authentication data (via Auth module)
 * - User-gym relationships (memberships, home gym)
 * - User physical metrics (height, weight, age calculated from birthdate)
 *
 * Exports:
 * - UsersService: For use in other modules that need user data access (e.g., AuthModule)
 */
@Module({
  imports: [TypeOrmModule.forFeature([User]), GymsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
