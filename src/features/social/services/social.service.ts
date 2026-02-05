import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { FollowsRepository } from '../repositories/follows-repository.interface';
import { FollowStatus } from '../types';
import {
  NOTIFICATION_EVENTS,
  FollowRequestEvent,
  FollowAcceptedEvent,
} from '../../notifications/interfaces/events.interface';
import { NotificationType } from '../../notifications/types';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@Injectable()
export class SocialService {
  constructor(
    @Inject('FOLLOWS_REPOSITORY')
    private readonly followsRepository: FollowsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Send a follow request to another user.
   */
  async sendFollowRequest(
    followerId: string,
    followeeId: string,
  ): Promise<void> {
    if (followerId === followeeId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existingRelation = await this.followsRepository.findOne(
      followerId,
      followeeId,
    );

    if (existingRelation) {
      if (existingRelation.status === FollowStatus.PENDING) {
        throw new BadRequestException('Follow request already sent');
      }
      if (existingRelation.status === FollowStatus.ACCEPTED) {
        throw new BadRequestException('Already following this user');
      }
      // If rejected, we can allow sending again
      await this.followsRepository.delete(followerId, followeeId);
    }

    await this.followsRepository.create(followerId, followeeId);

    // Emit event for follow request notification
    const followRequestEvent: FollowRequestEvent = {
      actorId: followerId,
      type: NotificationType.FOLLOW_REQUEST,
      followerId,
      followeeId,
    };
    this.eventEmitter.emit(
      NOTIFICATION_EVENTS.FOLLOW_REQUEST,
      followRequestEvent,
    );
  }

  /**
   * Accept a follow request.
   */
  async acceptFollowRequest(
    followeeId: string,
    followerId: string,
  ): Promise<void> {
    const relation = await this.followsRepository.findOne(
      followerId,
      followeeId,
    );

    if (!relation) {
      throw new NotFoundException('Follow request not found');
    }

    if (relation.status === FollowStatus.ACCEPTED) {
      throw new BadRequestException('Follow request already accepted');
    }

    if (relation.status === FollowStatus.REJECTED) {
      throw new BadRequestException('Cannot accept a rejected request');
    }

    await this.followsRepository.acceptFollowRequest(followerId, followeeId);

    // Emit event for follow accepted notification (notify the follower that their request was accepted)
    const followAcceptedEvent: FollowAcceptedEvent = {
      actorId: followeeId,
      type: NotificationType.FOLLOW_ACCEPTED,
      followerId,
      followeeId,
    };
    this.eventEmitter.emit(
      NOTIFICATION_EVENTS.FOLLOW_ACCEPTED,
      followAcceptedEvent,
    );
  }

  /**
   * Reject a follow request.
   */
  async rejectFollowRequest(
    followeeId: string,
    followerId: string,
  ): Promise<void> {
    const relation = await this.followsRepository.findOne(
      followerId,
      followeeId,
    );

    if (!relation) {
      throw new NotFoundException('Follow request not found');
    }

    if (relation.status === FollowStatus.REJECTED) {
      throw new BadRequestException('Follow request already rejected');
    }

    if (relation.status === FollowStatus.ACCEPTED) {
      throw new BadRequestException('Cannot reject an accepted request');
    }

    await this.followsRepository.rejectFollowRequest(followerId, followeeId);
  }

  /**
   * Unfollow a user (delete the relationship).
   */
  async unfollowUser(followerId: string, followeeId: string): Promise<void> {
    const relation = await this.followsRepository.findOne(
      followerId,
      followeeId,
    );

    if (!relation) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.followsRepository.delete(followerId, followeeId);
  }

  /**
   * Get followers for a user with pagination.
   */
  async getFollowers(
    userId: string,
    paginationDto: PaginationDto,
    status?: FollowStatus,
  ) {
    return this.followsRepository.findFollowers(userId, paginationDto, status);
  }

  /**
   * Get following for a user with pagination.
   */
  async getFollowing(
    userId: string,
    paginationDto: PaginationDto,
    status?: FollowStatus,
  ) {
    return this.followsRepository.findFollowing(userId, paginationDto, status);
  }

  /**
   * Get follow statistics for a user.
   */
  async getStats(userId: string) {
    return this.followsRepository.getStats(userId);
  }

  /**
   * Get the follow relationship between two users.
   */
  async getRelationship(followerId: string, followeeId: string) {
    const relation = await this.followsRepository.findOne(
      followerId,
      followeeId,
    );

    if (!relation) {
      return null;
    }

    return relation;
  }
}
