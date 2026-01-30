import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Post } from '../entities/post.entity';
import { Kudos } from '../entities/kudos.entity';
import { WorkoutsService } from 'src/features/workouts/services/workouts.service';
import { UsersService } from 'src/features/users/services/users.service';
import { FeedWriteService } from 'src/features/feed/services/feed-write.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import {
  NOTIFICATION_EVENTS,
  PostCreatedEvent,
  KudosReceivedEvent,
} from '../../notifications/interfaces/events.interface';
import { NotificationType } from '../../notifications/types';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Kudos)
    private readonly kudosRepository: Repository<Kudos>,
    private readonly workoutsService: WorkoutsService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => FeedWriteService))
    private readonly feedWriteService: FeedWriteService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Creates a new post from a workout participation.
   * Validates that the user is a participant in the workout before creating the post.
   * @param userId - The UUID of the user creating the post
   * @param createPostDto - The data transfer object containing post information
   * @returns Promise<Post> The newly created post entity
   * @throws NotFoundException if workout participation doesn't exist
   */
  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    // Fetch and validate the workout participation
    const workoutParticipant = await this.workoutsService.getMyParticipation(
      createPostDto.workoutId,
      userId,
    );

    if (!workoutParticipant) {
      throw new NotFoundException(
        `You are not a participant in workout ${createPostDto.workoutId}`,
      );
    }

    // Create the post
    const post = this.postRepository.create({
      title: createPostDto.title,
      caption: createPostDto.caption,
      workoutParticipantId: workoutParticipant.id,
      createdById: userId,
    });

    const savedPost = await this.postRepository.save(post);

    // Trigger fan-out to followers' feeds
    await this.feedWriteService.fanOutPost(
      savedPost.id,
      userId,
      savedPost.createdAt,
    );

    // Emit event for notifications
    const postCreatedEvent: PostCreatedEvent = {
      actorId: userId,
      type: NotificationType.NEW_POST,
      postId: savedPost.id,
      caption: savedPost.caption,
    };
    this.eventEmitter.emit(NOTIFICATION_EVENTS.POST_CREATED, postCreatedEvent);

    return savedPost;
  }

  /**
   * Finds a single post by its unique identifier.
   * @param id - The UUID of the post to find
   * @returns Promise<Post> The post entity with relations
   * @throws NotFoundException if no post exists with the given ID
   */
  async findOneOrFail(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['workoutParticipant', 'workoutParticipant.user'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  /**
   * Updates an existing post's information.
   * Only allows the post creator to update their own posts.
   * @param id - The UUID of the post to update
   * @param userId - The UUID of the user making the request
   * @param updatePostDto - The data transfer object containing updated post information
   * @returns Promise<Post> The updated post entity
   * @throws NotFoundException if post doesn't exist
   * @throws BadRequestException if user is not the post creator
   */
  async update(
    id: string,
    userId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Verify the user is the post creator
    if (post.createdById !== userId) {
      throw new BadRequestException('You can only update your own posts');
    }

    // Apply updates
    Object.assign(post, updatePostDto);

    return await this.postRepository.save(post);
  }

  /**
   * Deletes a post from the database.
   * Only allows the post creator to delete their own posts.
   * @param id - The UUID of the post to delete
   * @param userId - The UUID of the user making the request
   * @returns Promise<void>
   * @throws NotFoundException if post doesn't exist
   * @throws BadRequestException if user is not the post creator
   */
  async remove(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Verify the user is the post creator
    if (post.createdById !== userId) {
      throw new BadRequestException('You can only delete your own posts');
    }

    await this.postRepository.remove(post);
  }

  /**
   * Gives kudos to a post.
   * Validates that the post exists and increments the kudos count for the post creator.
   * Prevents users from giving kudos to the same post multiple times.
   * @param postId - The UUID of the post to give kudos to
   * @param userId - The UUID of the user giving kudos
   * @returns Promise<Kudos> The created kudos entity
   * @throws NotFoundException if post doesn't exist
   * @throws BadRequestException if user already gave kudos to this post
   */
  async giveKudos(postId: string, userId: string): Promise<Kudos> {
    // Validate the post exists
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Check if user already gave kudos to this post
    const existingKudos = await this.kudosRepository.findOne({
      where: {
        postId,
        givenById: userId,
      },
    });

    if (existingKudos) {
      throw new BadRequestException(
        'You have already given kudos to this post',
      );
    }

    // Create the kudos
    const kudos = this.kudosRepository.create({
      postId,
      givenById: userId,
    });

    const savedKudos = await this.kudosRepository.save(kudos);

    // Increment the kudos count for the post creator
    await this.usersService.incrementKudosCount(post.createdById);

    // Trigger kudos fan-out to followers' feeds
    await this.feedWriteService.fanOutKudos(
      savedKudos,
      savedKudos.createdAt,
    );

    // Emit event for notifications
    const kudosReceivedEvent: KudosReceivedEvent = {
      actorId: userId,
      type: NotificationType.KUDOS_RECEIVED,
      kudosId: savedKudos.id,
      postId,
      postCreatorId: post.createdById,
    };
    this.eventEmitter.emit(NOTIFICATION_EVENTS.KUDOS_RECEIVED, kudosReceivedEvent);

    return savedKudos;
  }
}
