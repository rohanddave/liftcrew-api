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
} from '@nestjs/common';
import { SocialService } from '../services/social.service';
import { SendFollowRequestDto } from '../dto/send-follow-request.dto';
import { AcceptFollowRequestDto } from '../dto/accept-follow-request.dto';
import { RejectFollowRequestDto } from '../dto/reject-follow-request.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { FollowStatus } from '../types';

@Controller('follows')
export class FollowsController {
  constructor(private readonly socialService: SocialService) {}

  /**
   * Send a follow request to another user.
   * POST /follows/:userId/request
   */
  @Post(':userId/request')
  @HttpCode(HttpStatus.CREATED)
  async sendFollowRequest(
    @Param('userId') followerId: string,
    @Body() dto: SendFollowRequestDto,
  ) {
    await this.socialService.sendFollowRequest(followerId, dto.followeeId);
    return { message: 'Follow request sent successfully' };
  }

  /**
   * Accept a follow request.
   * POST /follows/:userId/accept
   */
  @Post(':userId/accept')
  @HttpCode(HttpStatus.OK)
  async acceptFollowRequest(
    @Param('userId') followeeId: string,
    @Body() dto: AcceptFollowRequestDto,
  ) {
    await this.socialService.acceptFollowRequest(followeeId, dto.followerId);
    return { message: 'Follow request accepted successfully' };
  }

  /**
   * Reject a follow request.
   * POST /follows/:userId/reject
   */
  @Post(':userId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectFollowRequest(
    @Param('userId') followeeId: string,
    @Body() dto: RejectFollowRequestDto,
  ) {
    await this.socialService.rejectFollowRequest(followeeId, dto.followerId);
    return { message: 'Follow request rejected successfully' };
  }

  /**
   * Unfollow a user.
   * DELETE /follows/:userId/unfollow/:followeeId
   */
  @Delete(':userId/unfollow/:followeeId')
  @HttpCode(HttpStatus.OK)
  async unfollowUser(
    @Param('userId') followerId: string,
    @Param('followeeId') followeeId: string,
  ) {
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
