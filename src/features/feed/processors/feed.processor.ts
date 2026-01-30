import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedItem, FeedItemType } from '../entities/feed-item.entity';
import { Post } from 'src/features/posts/entities/post.entity';
import { SocialService } from 'src/features/social/services/social.service';
import { FollowStatus } from 'src/features/social/entities/follows.entity';
import {
  FanOutPostJobData,
  FanOutKudosJobData,
  CleanupFeedJobData,
  BackfillUserFeedJobData,
} from '../interfaces/job-data.interface';

@Processor({ name: 'feed-fanout', concurrency: 5 })
@Injectable()
export class FeedProcessor {
  private readonly logger = new Logger(FeedProcessor.name);
  private readonly BATCH_SIZE = 100;

  constructor(
    @InjectRepository(FeedItem)
    private feedItemRepo: Repository<FeedItem>,
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    private socialService: SocialService,
  ) {}

  @Process('fanout-post')
  async handleFanOutPost(job: Job<FanOutPostJobData>): Promise<any> {
    const { postId, actorId, activityAt, batchSize = this.BATCH_SIZE } = job.data;

    this.logger.log(`Starting fan-out for post ${postId}`);

    let page = 1;
    let hasMore = true;
    let totalProcessed = 0;

    try {
      while (hasMore) {
        // Get batch of ACCEPTED followers from Neo4j
        const followers = await this.socialService.getFollowers(
          actorId,
          page,
          batchSize,
          FollowStatus.ACCEPTED,
        );

        if (followers.length === 0) {
          hasMore = false;
          break;
        }

        // Create feed items for this batch
        const feedItems = followers.map((follower) => ({
          userId: follower.id,
          actorId,
          itemType: FeedItemType.POST,
          postId,
          activityAt,
        }));

        await this.batchCreateFeedItems(feedItems);

        totalProcessed += followers.length;

        // Update progress
        if (job.data.estimatedTotal) {
          const progress = Math.min(
            (totalProcessed / job.data.estimatedTotal) * 100,
            100,
          );
          await job.progress(progress);
        }

        // Check if we got less than batch size (last page)
        if (followers.length < batchSize) {
          hasMore = false;
        } else {
          page++;
        }
      }

      this.logger.log(`Completed fan-out for post ${postId}: ${totalProcessed} followers`);

      return { processed: totalProcessed };
    } catch (error) {
      this.logger.error(`Error in fan-out for post ${postId}:`, error);
      throw error;
    }
  }

  @Process('fanout-kudos')
  async handleFanOutKudos(job: Job<FanOutKudosJobData>): Promise<any> {
    const { kudosId, postId, kudosGiverId, activityAt } = job.data;

    this.logger.log(`Starting kudos fan-out for kudos ${kudosId}`);

    try {
      // Get the post to find the creator
      const post = await this.postRepo.findOne({
        where: { id: postId },
      });

      if (!post) {
        this.logger.warn(`Post ${postId} not found for kudos ${kudosId}`);
        return { processed: 0 };
      }

      const postCreatorId = post.createdById;
      let totalProcessed = 0;

      // Fan-out kudos_given to kudos giver's followers
      const giverFollowers = await this.socialService.getFollowers(
        kudosGiverId,
        1,
        this.BATCH_SIZE,
        FollowStatus.ACCEPTED,
      );

      if (giverFollowers.length > 0) {
        const giverFeedItems = giverFollowers.map((follower) => ({
          userId: follower.id,
          actorId: kudosGiverId,
          itemType: FeedItemType.KUDOS_GIVEN,
          postId,
          kudosId,
          activityAt,
        }));

        await this.batchCreateFeedItems(giverFeedItems);
        totalProcessed += giverFeedItems.length;
      }

      // Fan-out kudos_received to post creator's followers (if different from giver)
      if (postCreatorId !== kudosGiverId) {
        const creatorFollowers = await this.socialService.getFollowers(
          postCreatorId,
          1,
          this.BATCH_SIZE,
          FollowStatus.ACCEPTED,
        );

        if (creatorFollowers.length > 0) {
          const creatorFeedItems = creatorFollowers.map((follower) => ({
            userId: follower.id,
            actorId: postCreatorId,
            itemType: FeedItemType.KUDOS_RECEIVED,
            postId,
            kudosId,
            activityAt,
          }));

          await this.batchCreateFeedItems(creatorFeedItems);
          totalProcessed += creatorFeedItems.length;
        }
      }

      this.logger.log(`Completed kudos fan-out for ${kudosId}: ${totalProcessed} followers`);

      return { processed: totalProcessed };
    } catch (error) {
      this.logger.error(`Error in kudos fan-out for ${kudosId}:`, error);
      throw error;
    }
  }

  @Process('cleanup-post')
  async handleCleanupPost(job: Job<CleanupFeedJobData>): Promise<any> {
    const { postId } = job.data;

    this.logger.log(`Cleaning up feed items for post ${postId}`);

    try {
      const result = await this.feedItemRepo.delete({ postId });

      this.logger.log(`Cleaned up ${result.affected || 0} feed items for post ${postId}`);

      return { deleted: result.affected || 0 };
    } catch (error) {
      this.logger.error(`Error cleaning up feed for post ${postId}:`, error);
      throw error;
    }
  }

  @Process('backfill-user')
  async handleBackfillUser(job: Job<BackfillUserFeedJobData>): Promise<any> {
    const { userId, followedUserId, backfillDays = 30 } = job.data;

    this.logger.log(`Backfilling feed for user ${userId} with posts from ${followedUserId}`);

    try {
      // Get followed user's posts from last N days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - backfillDays);

      const recentPosts = await this.postRepo
        .createQueryBuilder('post')
        .where('post.createdById = :followedUserId', { followedUserId })
        .andWhere('post.createdAt > :cutoffDate', { cutoffDate })
        .orderBy('post.createdAt', 'DESC')
        .take(100) // Limit to 100 most recent
        .getMany();

      if (recentPosts.length === 0) {
        this.logger.log(`No recent posts to backfill for user ${userId}`);
        return { processed: 0 };
      }

      // Create feed items for new follower
      const feedItems = recentPosts.map((post) => ({
        userId,
        actorId: followedUserId,
        itemType: FeedItemType.POST,
        postId: post.id,
        activityAt: post.createdAt,
      }));

      await this.batchCreateFeedItems(feedItems);

      this.logger.log(`Backfilled ${feedItems.length} posts for user ${userId}`);

      return { processed: feedItems.length };
    } catch (error) {
      this.logger.error(`Error backfilling feed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Batch create feed items with duplicate handling
   */
  private async batchCreateFeedItems(
    items: Array<{
      userId: string;
      actorId: string;
      itemType: FeedItemType;
      postId?: string;
      kudosId?: string;
      activityAt: Date;
    }>,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const feedItems = items.map((item) => this.feedItemRepo.create(item));

    // Use orIgnore to handle duplicates gracefully
    await this.feedItemRepo
      .createQueryBuilder()
      .insert()
      .values(feedItems)
      .orIgnore()
      .execute();
  }
}
