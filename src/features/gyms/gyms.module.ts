import { Module } from '@nestjs/common';
import { GymsController } from './controllers/gyms.controller';
import { GymsService } from './services/gyms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gym } from './entities/gym.entity';

/**
 * Gyms Module
 *
 * Handles all gym-related functionality including:
 * - CRUD operations for gym entities
 * - Gym location management with coordinates
 * - Gym-user relationships (members, home gym)
 *
 * Exports:
 * - GymsService: For use in other modules that need gym data access
 */
@Module({
  imports: [TypeOrmModule.forFeature([Gym])],
  controllers: [GymsController],
  providers: [GymsService],
  exports: [GymsService],
})
export class GymsModule {}
