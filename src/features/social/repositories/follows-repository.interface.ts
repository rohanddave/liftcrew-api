import { PaginationDto } from 'src/common/pagination';
import { FollowStatus } from '../types';

export interface FollowRelationship {
  followerId: string;
  followeeId: string;
  status: FollowStatus;
  since: Date;
}

export interface FollowerResult {
  userId: string;
  username: string;
  name: string;
  imageUrl?: string;
  status: FollowStatus;
  since: Date;
}

export interface FollowsRepository {
  /**
   * Create a follow relationship between two users with pending status.
   */
  create(followerId: string, followingId: string): Promise<void>;

  /**
   * Remove a follow relationship.
   */
  delete(followerId: string, followingId: string): Promise<void>;

  /**
   * Accept a follow request.
   */
  acceptFollowRequest(followerId: string, followeeId: string): Promise<void>;

  /**
   * Reject a follow request.
   */
  rejectFollowRequest(followerId: string, followeeId: string): Promise<void>;

  /**
   * Update the close friend status.
   */
  updateCloseFriendStatus(
    followerId: string,
    followingId: string,
    isCloseFriend: boolean,
  ): Promise<void>;

  /**
   * Check if a follow relationship exists.
   */
  exists(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Get a specific follow relationship.
   */
  findOne(
    followerId: string,
    followingId: string,
  ): Promise<FollowRelationship | null>;

  /**
   * Find users who follow the given user (with pagination).
   */
  findFollowers(
    userId: string,
    paginationDto: PaginationDto,
    status?: FollowStatus,
  ): Promise<{ data: FollowerResult[]; total: number }>;

  /**
   * Find users the given user follows (with pagination).
   */
  findFollowing(
    userId: string,
    paginationDto: PaginationDto,
    status?: FollowStatus,
  ): Promise<{ data: FollowerResult[]; total: number }>;

  /**
   * Find users who mutually follow each other.
   */
  findMutualFollows(userId: string): Promise<any[]>;

  /**
   * Get follower and following counts.
   */
  getStats(userId: string): Promise<{
    followerCount: number;
    followingCount: number;
    pendingRequestsCount: number;
  }>;

  /**
   * Remove all relationships for a user (when deleting account).
   */
  deleteAllForUser(userId: string): Promise<void>;
}
