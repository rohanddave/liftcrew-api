import { Controller, Get, Query, Req } from '@nestjs/common';
import { FeedService } from '../services/feed.service';
import { FeedQueryDto } from '../dto/feed-query.dto';
import { RequestWithUser } from 'src/common/types/request.type';
import { FeedItemType } from '../entities/feed-item.entity';

/**
 * Controller for managing user feed operations.
 * Provides endpoints to retrieve personalized feeds based on followed users' activity.
 */
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /**
   * Get authenticated user's feed with all activity types
   * @param request - Request with authenticated user
   * @param query - Query parameters for pagination and filtering
   * @returns Paginated feed items
   */
  @Get()
  async getUserFeed(
    @Req() request: RequestWithUser,
    @Query() query: FeedQueryDto,
  ) {
    const { user } = request;
    return this.feedService.getFeed(user.id, {
      limit: query.limit,
      cursor: query.cursor,
      itemType: query.type,
    });
  }

  /**
   * Get authenticated user's feed filtered to posts only
   * @param request - Request with authenticated user
   * @param query - Query parameters for pagination
   * @returns Paginated feed items (posts only)
   */
  @Get('posts')
  async getPostsFeed(
    @Req() request: RequestWithUser,
    @Query() query: FeedQueryDto,
  ) {
    const { user } = request;
    return this.feedService.getFeed(user.id, {
      limit: query.limit,
      cursor: query.cursor,
      itemType: FeedItemType.POST,
    });
  }

  /**
   * Get authenticated user's feed filtered to kudos activity only
   * @param request - Request with authenticated user
   * @param query - Query parameters for pagination
   * @returns Paginated feed items (kudos activity only)
   */
  @Get('kudos')
  async getKudosFeed(
    @Req() request: RequestWithUser,
    @Query() query: FeedQueryDto,
  ) {
    const { user } = request;
    // For kudos, we don't filter by a single type since we want both given and received
    // The frontend can distinguish based on itemType
    return this.feedService.getFeed(user.id, {
      limit: query.limit,
      cursor: query.cursor,
    });
  }
}
