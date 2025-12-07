import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { SocialService } from '../services/social.service';
import { SendFollowRequestDto } from '../dto/send-follow-request.dto';
import { AcceptFollowRequestDto } from '../dto/accept-follow-request.dto';
import { RejectFollowRequestDto } from '../dto/reject-follow-request.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { FollowStatus } from '../types';
import { RequestWithUser } from 'src/common/types/request.type';

@Controller('follows')
export class FollowsController {
  constructor(private readonly socialService: SocialService) {}

  /**
   * Send a follow request to another user.
   * Uses authenticated user ID from request.user.id as the follower.
   * POST /follows/request
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async sendFollowRequest(
    @Req() request: RequestWithUser,
    @Body() dto: SendFollowRequestDto,
  ) {
    const followerId = request.user.id;
    await this.socialService.sendFollowRequest(followerId, dto.followeeId);
    return { message: 'Follow request sent successfully' };
  }

  /**
   * Accept a follow request.
   * Uses authenticated user ID from request.user.id as the followee (person accepting).
   * POST /follows/accept
   */
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async acceptFollowRequest(
    @Req() request: RequestWithUser,
    @Body() dto: AcceptFollowRequestDto,
  ) {
    const followeeId = request.user.id;
    await this.socialService.acceptFollowRequest(followeeId, dto.followerId);
    return { message: 'Follow request accepted successfully' };
  }

  /**
   * Reject a follow request.
   * Uses authenticated user ID from request.user.id as the followee (person rejecting).
   * POST /follows/reject
   */
  @Post('reject')
  @HttpCode(HttpStatus.OK)
  async rejectFollowRequest(
    @Req() request: RequestWithUser,
    @Body() dto: RejectFollowRequestDto,
  ) {
    const followeeId = request.user.id;
    await this.socialService.rejectFollowRequest(followeeId, dto.followerId);
    return { message: 'Follow request rejected successfully' };
  }

  /**
   * Unfollow a user.
   * Uses authenticated user ID from request.user.id as the follower (person unfollowing).
   * DELETE /follows/unfollow/:followeeId
   */
  @Delete('unfollow/:followeeId')
  @HttpCode(HttpStatus.OK)
  async unfollowUser(
    @Req() request: RequestWithUser,
    @Param('followeeId') followeeId: string,
  ) {
    const followerId = request.user.id;
    await this.socialService.unfollowUser(followerId, followeeId);
    return { message: 'Unfollowed successfully' };
  }

  /**
   * Get followers list for a user (paginated).
   * GET /follows/:userId/followers
   * Query params: page, limit, status (optional)
   */
  @Get(':userId/followers')
  async getFollowers(
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: FollowStatus,
  ) {
    console.log('pagination dto: ', paginationDto);
    console.log('paginationDto.limit type:', typeof paginationDto.limit);
    const result = await this.socialService.getFollowers(
      userId,
      paginationDto.page,
      paginationDto.limit,
      status,
    );

    return {
      data: result.data,
      pagination: {
        page: paginationDto.page,
        limit: paginationDto.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / paginationDto.limit),
      },
    };
  }

  /**
   * Get following list for a user (paginated).
   * GET /follows/:userId/following
   * Query params: page, limit, status (optional)
   */
  @Get(':userId/following')
  async getFollowing(
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: FollowStatus,
  ) {
    const result = await this.socialService.getFollowing(
      userId,
      paginationDto.page,
      paginationDto.limit,
      status,
    );

    return {
      data: result.data,
      pagination: {
        page: paginationDto.page,
        limit: paginationDto.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / paginationDto.limit),
      },
    };
  }

  /**
   * Get follow statistics for a user.
   * GET /follows/:userId/stats
   */
  @Get(':userId/stats')
  async getStats(@Param('userId') userId: string) {
    return this.socialService.getStats(userId);
  }

  /**
   * Get the follow relationship between two users.
   * GET /follows/:userId/relationship/:targetUserId
   */
  @Get(':userId/relationship/:targetUserId')
  async getRelationship(
    @Param('userId') followerId: string,
    @Param('targetUserId') followeeId: string,
  ) {
    const relationship = await this.socialService.getRelationship(
      followerId,
      followeeId,
    );

    if (!relationship) {
      return { exists: false, relationship: null };
    }

    return { exists: true, relationship };
  }
}
