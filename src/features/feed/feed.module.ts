import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './controllers/feed.controller';
import { FeedService } from './services/feed.service';
import { FeedWriteService } from './services/feed-write.service';
import { FeedProcessor } from './processors/feed.processor';
import { FeedItem } from './entities/feed-item.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { QueueModule } from 'src/infra/queue/queue.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeedItem, Post, User]),
    QueueModule,
    SocialModule.register({ type: 'graph' }),
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedWriteService, FeedProcessor],
  exports: [FeedService, FeedWriteService],
})
export class FeedModule {}
