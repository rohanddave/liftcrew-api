export interface FollowsRepository {
  /**
   * Create a follow relationship between two users.
   */
  create(followerId: string, followingId: string): Promise<void>;

  /**
   * Remove a follow relationship.
   */
  delete(followerId: string, followingId: string): Promise<void>;

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
  findOne(followerId: string, followingId: string): Promise<any | null>; // TODO: replace the any type with the correct type

  /**
   * Find users who follow the given user.
   */
  findFollowers(userId: string): Promise<any[]>;

  /**
   * Find users the given user follows.
   */
  findFollowing(userId: string): Promise<any[]>;

  /**
   * Find users who mutually follow each other.
   */
  findMutualFollows(userId: string): Promise<any[]>;

  /**
   * Get follower and following counts.
   */
  getStats(
    userId: string,
  ): Promise<{ followerCount: number; followingCount: number }>;

  /**
   * Remove all relationships for a user (when deleting account).
   */
  deleteAllForUser(userId: string): Promise<void>;
}
