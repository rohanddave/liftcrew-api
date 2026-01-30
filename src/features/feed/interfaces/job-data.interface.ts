export interface FanOutPostJobData {
  postId: string;
  actorId: string;
  activityAt: Date;
  batchSize?: number;
  estimatedTotal?: number;
}

export interface FanOutKudosJobData {
  kudosId: string;
  postId: string;
  kudosGiverId: string;
  postCreatorId: string;
  activityAt: Date;
  batchSize?: number;
}

export interface CleanupFeedJobData {
  postId: string;
  affectedUserIds?: string[];
}

export interface BackfillUserFeedJobData {
  userId: string;
  followedUserId: string;
  backfillDays?: number;
}
