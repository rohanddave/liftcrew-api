import { Module } from '@nestjs/common';
import { GymsController } from './controllers/gyms.controller';
import { GymsService } from './services/gyms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gym } from './entities/gym.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Gym])],
  controllers: [GymsController],
  providers: [GymsService],
  exports: [GymsService],
})
export class GymsModule {}
