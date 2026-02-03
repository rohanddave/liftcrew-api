import { FollowStatus } from '../types';
import {
  FollowerResult,
  FollowRelationship,
  FollowsRepository,
} from './follows-repository.interface';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follows } from '../entities/follows.entity';

@Injectable()
export class RelationalFollowsRepository implements FollowsRepository {
  constructor(
    @InjectRepository(Follows)
    private readonly followsRepository: Repository<Follows>,
  ) {}

  async create(followerId: string, followeeId: string): Promise<void> {
    await this.followsRepository.save({
      followerId,
      followeeId,
      status: FollowStatus.PENDING,
    });
  }

  async delete(followerId: string, followeeId: string): Promise<void> {
    await this.followsRepository.delete({
      followerId,
      followeeId,
    });
  }

  async acceptFollowRequest(
    followerId: string,
    followeeId: string,
  ): Promise<void> {
    await this.followsRepository.update(
      { followerId, followeeId, status: FollowStatus.PENDING },
      { status: FollowStatus.ACCEPTED },
    );
  }

  async rejectFollowRequest(
    followerId: string,
    followeeId: string,
  ): Promise<void> {
    await this.followsRepository.update(
      { followerId, followeeId, status: FollowStatus.PENDING },
      { status: FollowStatus.REJECTED },
    );
  }

  async updateCloseFriendStatus(
    _followerId: string,
    _followeeId: string,
    _isCloseFriend: boolean,
  ): Promise<void> {
    // Note: The Follows entity doesn't have an isCloseFriend field.
    // This would need to be added to the entity if this feature is needed.
    throw new Error(
      'Close friend status not supported - add isCloseFriend column to Follows entity',
    );
  }

  async exists(followerId: string, followeeId: string): Promise<boolean> {
    const count = await this.followsRepository.count({
      where: { followerId, followeeId },
    });
    return count > 0;
  }

  async findOne(
    followerId: string,
    followeeId: string,
  ): Promise<FollowRelationship | null> {
    const follow = await this.followsRepository.findOne({
      where: { followerId, followeeId },
    });

    if (!follow) {
      return null;
    }

    return {
      followerId: follow.followerId,
      followeeId: follow.followeeId,
      status: follow.status,
      since: follow.since,
    };
  }

  async findFollowers(
    userId: string,
    page: number,
    limit: number,
    status?: FollowStatus,
  ): Promise<{ data: FollowerResult[]; total: number }> {
    const queryBuilder = this.followsRepository
      .createQueryBuilder('follow')
      .innerJoinAndSelect('follow.follower', 'follower')
      .where('follow.followeeId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('follow.status = :status', { status });
    }

    const [follows, total] = await queryBuilder
      .orderBy('follow.since', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data: FollowerResult[] = follows.map((follow) => ({
      userId: follow.follower.id,
      username: follow.follower.username,
      name: follow.follower.username,
      imageUrl: follow.follower.imageUrl,
      status: follow.status,
      since: follow.since,
    }));

    return { data, total };
  }

  async findFollowing(
    userId: string,
    page: number,
    limit: number,
    status?: FollowStatus,
  ): Promise<{ data: FollowerResult[]; total: number }> {
    const queryBuilder = this.followsRepository
      .createQueryBuilder('follow')
      .innerJoinAndSelect('follow.followee', 'followee')
      .where('follow.followerId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('follow.status = :status', { status });
    }

    const [follows, total] = await queryBuilder
      .orderBy('follow.since', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data: FollowerResult[] = follows.map((follow) => ({
      userId: follow.followee.id,
      username: follow.followee.username,
      name: follow.followee.username,
      imageUrl: follow.followee.imageUrl,
      status: follow.status,
      since: follow.since,
    }));

    return { data, total };
  }

  async findMutualFollows(userId: string): Promise<FollowerResult[]> {
    // Find users where both follow relationships exist and are accepted
    const mutualFollows = await this.followsRepository
      .createQueryBuilder('follow')
      .innerJoinAndSelect('follow.followee', 'followee')
      .innerJoin(
        Follows,
        'reverseFollow',
        'reverseFollow.followerId = follow.followeeId AND reverseFollow.followeeId = follow.followerId',
      )
      .where('follow.followerId = :userId', { userId })
      .andWhere('follow.status = :status', { status: FollowStatus.ACCEPTED })
      .andWhere('reverseFollow.status = :status', {
        status: FollowStatus.ACCEPTED,
      })
      .getMany();

    return mutualFollows.map((follow) => ({
      userId: follow.followee.id,
      username: follow.followee.username,
      name: follow.followee.username,
      imageUrl: follow.followee.imageUrl,
      status: follow.status,
      since: follow.since,
    }));
  }

  async getStats(userId: string): Promise<{
    followerCount: number;
    followingCount: number;
    pendingRequestsCount: number;
  }> {
    const [followerCount, followingCount, pendingRequestsCount] =
      await Promise.all([
        // Count accepted followers
        this.followsRepository.count({
          where: { followeeId: userId, status: FollowStatus.ACCEPTED },
        }),
        // Count accepted following
        this.followsRepository.count({
          where: { followerId: userId, status: FollowStatus.ACCEPTED },
        }),
        // Count pending requests (people wanting to follow the user)
        this.followsRepository.count({
          where: { followeeId: userId, status: FollowStatus.PENDING },
        }),
      ]);

    return {
      followerCount,
      followingCount,
      pendingRequestsCount,
    };
  }

  async deleteAllForUser(userId: string): Promise<void> {
    // Delete all relationships where user is either follower or followee
    await this.followsRepository
      .createQueryBuilder()
      .delete()
      .where('followerId = :userId OR followeeId = :userId', { userId })
      .execute();
  }
}
