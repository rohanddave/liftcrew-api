import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './controllers/posts.controller';
import { PostsService } from './services/posts.service';
import { Post } from './entities/post.entity';
import { Kudos } from './entities/kudos.entity';
import { WorkoutsModule } from '../workouts/workouts.module';
import { UsersModule } from '../users/users.module';
import { FeedModule } from '../feed/feed.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Kudos]),
    WorkoutsModule,
    UsersModule,
    forwardRef(() => FeedModule),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
