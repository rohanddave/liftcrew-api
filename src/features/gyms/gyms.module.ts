import { Module } from '@nestjs/common';
import { GymsController } from './controllers/gyms.controller';
import { GymsService } from './services/gyms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gym } from './entities/gym.entity';
import { GymEquipment } from './entities/gym-equipment.entity';
import { GymEquipmentController } from './controllers/gym-equipment.controller';
import { GymEquipmentService } from './services/gym-equipment.service';
import { User } from '../users/entities/user.entity';

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
  imports: [TypeOrmModule.forFeature([Gym, GymEquipment, User])],
  controllers: [GymsController, GymEquipmentController],
  providers: [GymsService, GymEquipmentService],
  exports: [GymsService],
})
export class GymsModule {}
