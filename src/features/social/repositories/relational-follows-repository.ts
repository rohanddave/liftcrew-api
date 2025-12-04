import { FollowsRepository } from './follows-repository.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RelationalFollowsRepository implements FollowsRepository {
  create(followerId: string, followingId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(followerId: string, followingId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updateCloseFriendStatus(
    followerId: string,
    followingId: string,
    isCloseFriend: boolean,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  exists(followerId: string, followingId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  findOne(followerId: string, followingId: string): Promise<any | null> {
    throw new Error('Method not implemented.');
  }
  findFollowers(userId: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  findFollowing(userId: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  findMutualFollows(userId: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  getStats(
    userId: string,
  ): Promise<{ followerCount: number; followingCount: number }> {
    throw new Error('Method not implemented.');
  }
  deleteAllForUser(userId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
