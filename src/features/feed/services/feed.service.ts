import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { FeedItem, FeedItemType } from '../entities/feed-item.entity';
import { Post } from 'src/features/posts/entities/post.entity';
import { User } from 'src/features/users/entities/user.entity';

export interface HydratedFeedItem {
  id: string;
  itemType: FeedItemType;
  activityAt: Date;
  actor: {
    id: string;
    username: string;
    imageUrl?: string;
  };
  post?: {
    id: string;
    title: string;
    caption?: string;
    kudosCount: number;
    createdAt: Date;
    createdBy: {
      id: string;
      username: string;
    };
  };
  kudos?: {
    id: string;
    createdAt: Date;
  };
}

export interface FeedResponse {
  items: HydratedFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(FeedItem)
    private feedItemRepo: Repository<FeedItem>,
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Get paginated feed for user
   * Currently only uses PostgreSQL (Redis caching will be added in Phase 4)
   */
  async getFeed(
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
      itemType?: FeedItemType;
    },
  ): Promise<FeedResponse> {
    const limit = options.limit || 20;
    const cursor = options.cursor ? new Date(options.cursor) : undefined;

    // Build query
    const queryBuilder = this.feedItemRepo
      .createQueryBuilder('feedItem')
      .where('feedItem.userId = :userId', { userId });

    if (options.itemType) {
      queryBuilder.andWhere('feedItem.itemType = :itemType', {
        itemType: options.itemType,
      });
    }

    if (cursor) {
      queryBuilder.andWhere('feedItem.activityAt < :cursor', { cursor });
    }

    const feedItems = await queryBuilder
      .orderBy('feedItem.activityAt', 'DESC')
      .take(limit + 1) // Fetch one extra to check if there are more
      .getMany();

    // Check if there are more items
    const hasMore = feedItems.length > limit;
    if (hasMore) {
      feedItems.pop(); // Remove the extra item
    }

    // Hydrate feed items
    const hydratedItems = await this.hydrateFeedItems(feedItems);

    // Get next cursor
    const nextCursor =
      hasMore && feedItems.length > 0
        ? feedItems[feedItems.length - 1].activityAt.toISOString()
        : null;

    console.log('Hydrated Feed Items:', JSON.stringify(hydratedItems));

    return {
      items: hydratedItems,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Hydrate feed items with full Post and User data
   * Prevents N+1 queries by batch fetching
   */
  private async hydrateFeedItems(
    items: FeedItem[],
  ): Promise<HydratedFeedItem[]> {
    if (items.length === 0) {
      return [];
    }

    // Collect all IDs
    const postIds = items
      .filter((i) => i.postId)
      .map((i) => i.postId)
      .filter((id): id is string => id !== null);
    const userIds = [...new Set(items.map((i) => i.actorId))];

    // Batch fetch
    const [posts, users] = await Promise.all([
      postIds.length > 0
        ? this.postRepo.find({
            where: { id: In(postIds) },
            relations: { createdBy: true },
          })
        : Promise.resolve([]),
      this.userRepo.find({
        where: { id: In(userIds) },
      }),
    ]);

    // Create lookup maps
    const postMap = new Map(posts.map((p) => [p.id, p]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Hydrate
    return items.map((item) => {
      const actor = userMap.get(item.actorId);
      const post = item.postId ? postMap.get(item.postId) : undefined;

      return {
        id: item.id,
        itemType: item.itemType,
        activityAt: item.activityAt,
        actor: {
          id: actor?.id || item.actorId,
          username: actor?.username || 'Unknown',
          imageUrl: actor?.imageUrl,
        },
        post: post,
        kudos: item.kudosId
          ? {
              id: item.kudosId,
              createdAt: item.createdAt,
            }
          : undefined,
      };
    });
  }
}
