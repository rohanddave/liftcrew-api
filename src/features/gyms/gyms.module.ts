import { Module } from '@nestjs/common';
import { GymsController } from './controllers/gyms.controller';
import { GymsService } from './services/gyms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gym } from './entities/gym.entity';
import { GymEquipment } from './entities/gym-equipment.entity';
import { GymEquipmentController } from './controllers/gym-equipment.controller';
import { GymEquipmentService } from './services/gym-equipment.service';
import { User } from '../users/entities/user.entity';
import { RedisModule } from 'src/infra/redis/redis.module';
import { GymPresenceService } from './services/gym-presence.service';
import { SocialModule } from '../social/social.module';

/**
 * Gyms Module
 *
 * Handles all gym-related functionality including:
 * - CRUD operations for gym entities
 * - Gym location management with coordinates
 * - Gym-user relationships (members, home gym)
 * - Gym presence tracking (check-in/check-out)
 *
 * Exports:
 * - GymsService: For use in other modules that need gym data access
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Gym, GymEquipment, User]),
    RedisModule,
    SocialModule.register({ type: 'relational', withController: false }),
  ],
  controllers: [GymsController, GymEquipmentController],
  providers: [GymsService, GymEquipmentService, GymPresenceService],
  exports: [GymsService],
})
export class GymsModule {}
