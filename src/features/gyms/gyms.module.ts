import { Module } from '@nestjs/common';
import { GymsController } from './controllers/gyms.controller';
import { GymsService } from './services/gyms.service';

@Module({
  controllers: [GymsController],
  providers: [GymsService],
  exports: [GymsService],
})
export class GymsModule {}
