import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { RequestWithUser } from 'src/common/types/request.type';

/**
 * Controller for managing post-related operations.
 * Handles CRUD operations for posts created from workout participations.
 */
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Creates a new post from a workout participation.
   * Validates that the user is a participant in the workout.
   * @param request - Request with authenticated user
   * @param createPostDto - The data transfer object containing post details and workoutId
   * @returns Promise<Post> The newly created post entity
   * @throws NotFoundException if user is not a participant in the workout
   */
  @Post()
  create(@Req() request: RequestWithUser, @Body() createPostDto: CreatePostDto) {
    const { user } = request;
    return this.postsService.create(user.id, createPostDto);
  }

  /**
   * Retrieves a single post by its ID.
   * @param id - The UUID of the post to retrieve
   * @returns Promise<Post> The post entity with relations
   * @throws NotFoundException if post with given ID is not found
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOneOrFail(id);
  }

  /**
   * Updates an existing post's title and/or caption.
   * Only the post creator can update their own posts.
   * @param request - Request with authenticated user
   * @param id - The UUID of the post to update
   * @param updatePostDto - The data transfer object containing updated post details
   * @returns Promise<Post> The updated post entity
   * @throws NotFoundException if post with given ID is not found
   * @throws BadRequestException if user is not the post creator
   */
  @Put(':id')
  update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const { user } = request;
    return this.postsService.update(id, user.id, updatePostDto);
  }

  /**
   * Deletes a post from the database.
   * Only the post creator can delete their own posts.
   * @param request - Request with authenticated user
   * @param id - The UUID of the post to delete
   * @returns Promise<void>
   * @throws NotFoundException if post with given ID is not found
   * @throws BadRequestException if user is not the post creator
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() request: RequestWithUser, @Param('id') id: string) {
    const { user } = request;
    return this.postsService.remove(id, user.id);
  }

  /**
   * Gives kudos to a post.
   * Validates that the post exists and increments the kudos count for the post creator.
   * Prevents users from giving kudos to the same post multiple times.
   * @param request - Request with authenticated user
   * @param id - The UUID of the post to give kudos to
   * @returns Promise<Kudos> The created kudos entity
   * @throws NotFoundException if post with given ID is not found
   * @throws BadRequestException if user already gave kudos to this post
   */
  @Post(':id/kudos')
  giveKudos(@Req() request: RequestWithUser, @Param('id') id: string) {
    const { user } = request;
    return this.postsService.giveKudos(id, user.id);
  }
}
