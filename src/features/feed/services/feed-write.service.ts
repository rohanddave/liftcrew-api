import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { FeedItem, FeedItemType } from '../entities/feed-item.entity';
import { Kudos } from 'src/features/posts/entities/kudos.entity';
import { SocialService } from 'src/features/social/services/social.service';
import {
  FanOutPostJobData,
  FanOutKudosJobData,
  CleanupFeedJobData,
} from '../interfaces/job-data.interface';
import { FollowStatus } from 'src/features/social/types';

@Injectable()
export class FeedWriteService {
  private readonly DIRECT_WRITE_THRESHOLD = 50;

  constructor(
    @InjectRepository(FeedItem)
    private feedItemRepo: Repository<FeedItem>,
    @InjectQueue('feed-fanout')
    private feedQueue: Queue,
    private socialService: SocialService,
  ) {}

  /**
   * Trigger fan-out for new post
   * - If followers < 50: direct write (synchronous)
   * - Else: enqueue job (asynchronous)
   */
  async fanOutPost(
    postId: string,
    actorId: string,
    activityAt: Date,
  ): Promise<void> {
    // Get follower count
    const stats = await this.socialService.getStats(actorId);

    if (stats.followerCount < this.DIRECT_WRITE_THRESHOLD) {
      // Direct write for small follower count
      await this.directFanOutPost(postId, actorId, activityAt);
    } else {
      // Enqueue job for large follower count
      const jobData: FanOutPostJobData = {
        postId,
        actorId,
        activityAt,
        estimatedTotal: stats.followerCount,
      };

      await this.feedQueue.add('fanout-post', jobData, {
        priority: 1, // High priority for real-time posts
      });
    }

    // Also add to actor's own feed
    await this.createFeedItem({
      userId: actorId,
      actorId,
      itemType: FeedItemType.POST,
      postId,
      activityAt,
    });
  }

  /**
   * Direct fan-out for small follower counts
   */
  private async directFanOutPost(
    postId: string,
    actorId: string,
    activityAt: Date,
  ): Promise<void> {
    // Get all ACCEPTED followers
    const { data: followers } = await this.socialService.getFollowers(
      actorId,
      1,
      this.DIRECT_WRITE_THRESHOLD,
      FollowStatus.ACCEPTED,
    );

    if (followers.length === 0) {
      return;
    }

    // Create feed items for all followers
    const feedItems = followers.map((follower) => ({
      userId: follower.userId,
      actorId,
      itemType: FeedItemType.POST,
      postId,
      activityAt,
    }));

    await this.batchCreateFeedItems(feedItems);
  }

  /**
   * Trigger fan-out for kudos
   * Creates two types of feed items:
   * 1. kudos_given -> to kudos giver's followers
   * 2. kudos_received -> to post creator's followers
   */
  async fanOutKudos(kudos: Kudos, activityAt: Date): Promise<void> {
    // We need to get the post to find the creator
    // For now, enqueue job which will handle fetching the post
    const jobData: FanOutKudosJobData = {
      kudosId: kudos.id,
      postId: kudos.postId,
      kudosGiverId: kudos.givenById,
      postCreatorId: '', // Will be fetched in the job processor
      activityAt,
    };

    await this.feedQueue.add('fanout-kudos', jobData, {
      priority: 2, // Lower priority than posts
    });
  }

  /**
   * Delete all feed items for a post
   */
  async cleanupPostFeed(postId: string): Promise<void> {
    const jobData: CleanupFeedJobData = {
      postId,
    };

    await this.feedQueue.add('cleanup-post', jobData, {
      priority: 5, // Lower priority
    });
  }

  /**
   * Batch create feed items
   */
  async batchCreateFeedItems(
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

    const feedItems = items.map((item) =>
      this.feedItemRepo.create({
        ...item,
      }),
    );

    // Use insert with orIgnore to handle potential duplicates
    await this.feedItemRepo
      .createQueryBuilder()
      .insert()
      .values(feedItems)
      .orIgnore()
      .execute();
  }

  /**
   * Create a single feed item
   */
  private async createFeedItem(data: {
    userId: string;
    actorId: string;
    itemType: FeedItemType;
    postId?: string;
    kudosId?: string;
    activityAt: Date;
  }): Promise<void> {
    const feedItem = this.feedItemRepo.create(data);

    await this.feedItemRepo.save(feedItem);
  }
}
