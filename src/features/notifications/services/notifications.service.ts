import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
  PostCreatedEvent,
  KudosReceivedEvent,
  FollowRequestEvent,
  FollowAcceptedEvent,
  GymCheckInEvent,
  NOTIFICATION_EVENTS,
} from '../interfaces/events.interface';
import { UserNotificationSettings } from '../entities/user-notification-settings.entity';
import { encrypt, decrypt } from '../utils/encryption.util';
import { NotificationType } from '../types';
import {
  FanOutNotificationJobData,
  SendNotificationJobData,
} from '../interfaces/job-data.interface';
import { SocialService } from '../../social/services/social.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(UserNotificationSettings)
    private userNotificationSettingsRepo: Repository<UserNotificationSettings>,
    @InjectQueue('notifications')
    private notificationsQueue: Queue,
    private socialService: SocialService,
    private configService: ConfigService,
  ) {
    const key = this.configService.get<string>('FCM_ENCRYPTION_KEY');
    if (!key || key.length !== 64) {
      throw new Error(
        'FCM_ENCRYPTION_KEY must be a 32-byte hex string (64 characters). ' +
          "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }
    this.encryptionKey = key;
  }

  /**
   * Register or update user's FCM token
   * @param userId - User ID
   * @param fcmToken - Plain FCM device token
   * @param platform - Device platform
   * @param deviceModel - Optional device model
   */
  async registerFcmToken(userId: string, fcmToken: string): Promise<void> {
    try {
      // Encrypt the FCM token
      const encryptedToken = encrypt(fcmToken, this.encryptionKey);

      // Upsert user notification settings
      const existing = await this.userNotificationSettingsRepo.findOne({
        where: { userId },
      });

      if (existing) {
        existing.fcmTokenEncrypted = encryptedToken;
        existing.lastActiveAt = new Date();
        await this.userNotificationSettingsRepo.save(existing);
        this.logger.log(`Updated FCM token for user ${userId}`);
      } else {
        const settings = this.userNotificationSettingsRepo.create({
          userId,
          fcmTokenEncrypted: encryptedToken,
          lastActiveAt: new Date(),
        });
        await this.userNotificationSettingsRepo.save(settings);
        this.logger.log(`Registered FCM token for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to register FCM token for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Unregister user's FCM token
   * @param userId - User ID
   */
  async unregisterFcmToken(userId: string): Promise<void> {
    try {
      await this.userNotificationSettingsRepo.update(
        { userId },
        { fcmTokenEncrypted: null, platform: null, deviceModel: null },
      );
      this.logger.log(`Unregistered FCM token for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to unregister FCM token for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get user's decrypted FCM token
   * @param userId - User ID
   * @returns Decrypted FCM token or null
   */
  async getUserFcmToken(userId: string): Promise<string | null> {
    try {
      const settings = await this.userNotificationSettingsRepo.findOne({
        where: { userId },
      });

      if (!settings || !settings.fcmTokenEncrypted) {
        return null;
      }

      return decrypt(settings.fcmTokenEncrypted, this.encryptionKey);
    } catch (error) {
      this.logger.error(
        `Failed to get FCM token for user ${userId}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Get multiple users' decrypted FCM tokens
   * @param userIds - Array of user IDs
   * @returns Map of userId to FCM token
   */
  async getUsersFcmTokens(userIds: string[]): Promise<Map<string, string>> {
    const tokensMap = new Map<string, string>();

    try {
      const settings = await this.userNotificationSettingsRepo
        .createQueryBuilder('settings')
        .where('settings.userId IN (:...userIds)', { userIds })
        .andWhere('settings.fcmTokenEncrypted IS NOT NULL')
        .getMany();

      for (const setting of settings) {
        try {
          const decryptedToken = decrypt(
            setting.fcmTokenEncrypted,
            this.encryptionKey,
          );
          tokensMap.set(setting.userId, decryptedToken);
        } catch (error) {
          this.logger.warn(
            `Failed to decrypt token for user ${setting.userId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to get users FCM tokens:', error);
    }

    return tokensMap;
  }

  /**
   * Event listener: New post created
   * Fans out notifications to all followers
   */
  @OnEvent(NOTIFICATION_EVENTS.POST_CREATED)
  async handlePostCreated(event: PostCreatedEvent): Promise<void> {
    this.logger.log(
      `Handling post created event: ${event.postId} by ${event.actorId}`,
    );

    try {
      const stats = await this.socialService.getStats(event.actorId);

      if (stats.followerCount === 0) {
        this.logger.debug('No followers to notify');
        return;
      }

      const payload = {
        title: 'New Post',
        body: event.caption || 'Someone you follow posted a workout',
        data: {
          type: NotificationType.NEW_POST,
          postId: event.postId,
          actorId: event.actorId,
        },
      };

      const jobData: FanOutNotificationJobData = {
        actorId: event.actorId,
        type: NotificationType.NEW_POST,
        entityId: event.postId,
        entityType: 'post',
        payload,
        estimatedTotal: stats.followerCount,
      };

      await this.notificationsQueue.add('fanout-notification', jobData, {
        priority: 1,
      });

      this.logger.log(
        `Enqueued fan-out notification for post ${event.postId} (${stats.followerCount} followers)`,
      );
    } catch (error) {
      this.logger.error('Failed to handle post created event:', error);
    }
  }

  /**
   * Event listener: Kudos received on a post
   * Notifies the post creator
   */
  @OnEvent(NOTIFICATION_EVENTS.KUDOS_RECEIVED)
  async handleKudosReceived(event: KudosReceivedEvent): Promise<void> {
    this.logger.log(
      `Handling kudos received event: ${event.kudosId} on post ${event.postId}`,
    );

    // Don't notify if user gave kudos to their own post
    if (event.actorId === event.postCreatorId) {
      return;
    }

    try {
      const jobData: SendNotificationJobData = {
        userId: event.postCreatorId,
        type: NotificationType.KUDOS_RECEIVED,
        entityId: event.kudosId,
        entityType: 'kudos',
        actorId: event.actorId,
        payload: {
          title: 'Kudos!',
          body: 'Someone gave kudos to your post',
          data: {
            kudosId: event.kudosId,
            postId: event.postId,
            actorId: event.actorId,
          },
        },
      };

      await this.notificationsQueue.add('send-notification', jobData, {
        priority: 1,
      });

      this.logger.log(
        `Enqueued kudos notification for user ${event.postCreatorId}`,
      );
    } catch (error) {
      this.logger.error('Failed to handle kudos received event:', error);
    }
  }

  /**
   * Event listener: Follow request received
   * Notifies the user who received the follow request
   */
  @OnEvent(NOTIFICATION_EVENTS.FOLLOW_REQUEST)
  async handleFollowRequest(event: FollowRequestEvent): Promise<void> {
    this.logger.log(
      `Handling follow request event: ${event.followerId} sent request to ${event.followeeId}`,
    );

    try {
      const jobData: SendNotificationJobData = {
        userId: event.followeeId,
        type: NotificationType.FOLLOW_REQUEST,
        entityId: event.followerId,
        entityType: 'follow',
        actorId: event.followerId,
        payload: {
          title: 'Follow Request',
          body: 'Someone wants to follow you',
          data: {
            type: NotificationType.FOLLOW_REQUEST,
            followerId: event.followerId,
            followeeId: event.followeeId,
          },
        },
      };

      await this.notificationsQueue.add('send-notification', jobData);

      this.logger.log(
        `Enqueued follow request notification for user ${event.followeeId}`,
      );
    } catch (error) {
      this.logger.error('Failed to handle follow request event:', error);
    }
  }

  /**
   * Event listener: Follow request accepted
   * Notifies the user whose follow request was accepted
   */
  @OnEvent(NOTIFICATION_EVENTS.FOLLOW_ACCEPTED)
  async handleFollowAccepted(event: FollowAcceptedEvent): Promise<void> {
    this.logger.log(
      `Handling follow accepted event: ${event.followeeId} accepted ${event.followerId}'s request`,
    );

    try {
      const jobData: SendNotificationJobData = {
        userId: event.followerId,
        type: NotificationType.FOLLOW_ACCEPTED,
        entityId: event.followeeId,
        entityType: 'follow',
        actorId: event.followeeId,
        payload: {
          title: 'Follow Request Accepted',
          body: 'Your follow request was accepted',
          data: {
            type: NotificationType.FOLLOW_ACCEPTED,
            followerId: event.followerId,
            followeeId: event.followeeId,
          },
        },
      };

      await this.notificationsQueue.add('send-notification', jobData);

      this.logger.log(
        `Enqueued follow accepted notification for user ${event.followerId}`,
      );
    } catch (error) {
      this.logger.error('Failed to handle follow accepted event:', error);
    }
  }

  /**
   * Event listener: Gym check-in
   * Fans out notifications to all followers
   */
  @OnEvent(NOTIFICATION_EVENTS.GYM_CHECK_IN)
  async handleGymCheckIn(event: GymCheckInEvent): Promise<void> {
    this.logger.log(
      `Handling gym check-in event: ${event.actorId} checked in at ${event.gymName}`,
    );

    try {
      const stats = await this.socialService.getStats(event.actorId);

      if (stats.followerCount === 0) {
        this.logger.debug('No followers to notify');
        return;
      }

      const payload = {
        title: 'Gym Check-in',
        body: `Someone you follow checked in at ${event.gymName}`,
        data: {
          type: NotificationType.GYM_CHECK_IN,
          gymId: event.gymId,
          gymName: event.gymName,
          actorId: event.actorId,
        },
      };

      const jobData: FanOutNotificationJobData = {
        actorId: event.actorId,
        type: NotificationType.GYM_CHECK_IN,
        entityId: event.gymId,
        entityType: 'gym',
        payload,
        estimatedTotal: stats.followerCount,
      };

      await this.notificationsQueue.add('fanout-notification', jobData, {
        priority: 1,
      });

      this.logger.log(
        `Enqueued fan-out notification for gym check-in at ${event.gymName} (${stats.followerCount} followers)`,
      );
    } catch (error) {
      this.logger.error('Failed to handle gym check-in event:', error);
    }
  }

}
