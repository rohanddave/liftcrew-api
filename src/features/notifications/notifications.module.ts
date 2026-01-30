import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueModule } from '../../infra/queue/queue.module';
import { FirebaseModule } from '../../infra/firebase/firebase.module';
import { SocialModule } from '../social/social.module';
import { AuthModule } from '../auth/auth.module';
import { UserNotificationSettings } from './entities/user-notification-settings.entity';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationsProcessor } from './processors/notifications.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserNotificationSettings]),
    QueueModule,
    SocialModule.register({ type: 'graph' }),
    FirebaseModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
