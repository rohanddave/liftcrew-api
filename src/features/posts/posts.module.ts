import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './controllers/posts.controller';
import { PostsService } from './services/posts.service';
import { Post } from './entities/post.entity';
import { WorkoutsModule } from '../workouts/workouts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), WorkoutsModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
