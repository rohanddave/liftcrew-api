import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  MulticastMessage,
  Message,
} from 'firebase-admin/lib/messaging/messaging-api';
import {
  FanOutNotificationJobData,
  SendNotificationJobData,
} from '../interfaces/job-data.interface';
import { NotificationsService } from '../services/notifications.service';
import { SocialService } from '../../social/services/social.service';
import { FollowStatus } from '../../social/types';
import { FirebasePushNotificationsService } from 'src/infra/firebase/services/firebase-notifications.service';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@Processor('notifications')
@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private readonly BATCH_SIZE = 100;
  private readonly FCM_BATCH_LIMIT = 500; // Firebase multicast limit

  constructor(
    private firebasePushNotificationsService: FirebasePushNotificationsService,
    private notificationsService: NotificationsService,
    private socialService: SocialService,
  ) {}

  /**
   * Process fan-out notification job
   * Fetches all followers and sends push notifications to them
   */
  @Process('fanout-notification')
  async handleFanOutNotification(
    job: Job<FanOutNotificationJobData>,
  ): Promise<any> {
    const {
      actorId,
      type,
      entityId,
      payload,
      targetUserIds,
      batchSize = this.BATCH_SIZE,
    } = job.data;

    this.logger.log(
      `Processing fan-out notification: ${type} for entity ${entityId}`,
    );

    let totalProcessed = 0;
    let totalSent = 0;

    try {
      if (targetUserIds) {
        // Send to specific users
        const result = await this.sendToSpecificUsers(targetUserIds, payload);
        totalProcessed = targetUserIds.length;
        totalSent = result.sentCount;
      } else {
        // Fan-out to all followers
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const paginationDto = new PaginationDto();
          paginationDto.page = page;
          paginationDto.limit = batchSize;

          const { data: followers } = await this.socialService.getFollowers(
            actorId,
            paginationDto,
            FollowStatus.ACCEPTED,
          );

          if (followers.length === 0) {
            hasMore = false;
            break;
          }

          // Get user IDs
          const userIds = followers.map((f) => f.userId);

          // Fetch FCM tokens for this batch
          const tokensMap =
            await this.notificationsService.getUsersFcmTokens(userIds);

          if (tokensMap.size > 0) {
            // Extract tokens
            const fcmTokens = Array.from(tokensMap.values());

            // Send via Firebase (in batches of 500)
            const sentCount = await this.sendMulticastNotifications(
              fcmTokens,
              payload,
            );

            totalSent += sentCount;
          }

          totalProcessed += followers.length;

          // Update progress
          if (job.data.estimatedTotal) {
            const progress = Math.min(
              (totalProcessed / job.data.estimatedTotal) * 100,
              100,
            );
            await job.progress(progress);
          }

          if (followers.length < batchSize) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }

      this.logger.log(
        `Completed fan-out notification: ${totalProcessed} users processed, ${totalSent} notifications sent`,
      );

      return { processed: totalProcessed, sent: totalSent };
    } catch (error) {
      this.logger.error('Error in fan-out notification:', error);
      throw error;
    }
  }

  /**
   * Process single notification job
   * Sends push notification to one user
   */
  @Process('send-notification')
  async handleSendNotification(
    job: Job<SendNotificationJobData>,
  ): Promise<any> {
    const { userId, type, payload } = job.data;

    this.logger.log(`Processing notification for user ${userId}: ${type}`);

    try {
      // Get user's FCM token
      const fcmToken = await this.notificationsService.getUserFcmToken(userId);

      if (!fcmToken) {
        this.logger.debug(`No FCM token for user ${userId}`);
        return { success: false, reason: 'No FCM token' };
      }

      // Build Firebase message
      const message: Message = {
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
          // imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        // android: {
        //   priority: 'high',
        //   notification: {
        //     sound: 'default',
        //   },
        // },
        apns: {
          payload: {
            aps: { sound: 'default' },
          },
        },
      };

      // Send via Firebase
      const response =
        await this.firebasePushNotificationsService.sendNotification(message);

      const success = !!response;

      if (success) {
        this.logger.log(`Notification sent successfully to user ${userId}`);
      } else {
        this.logger.warn(`Failed to send notification to user ${userId}`);
      }

      return { success };
    } catch (error) {
      this.logger.error(`Error sending notification to ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send notifications to specific list of users
   */
  private async sendToSpecificUsers(
    userIds: string[],
    payload: any,
  ): Promise<{ sentCount: number }> {
    // Fetch FCM tokens for all users
    const tokensMap =
      await this.notificationsService.getUsersFcmTokens(userIds);

    if (tokensMap.size === 0) {
      this.logger.debug('No FCM tokens found for target users');
      return { sentCount: 0 };
    }

    // Extract tokens
    const fcmTokens = Array.from(tokensMap.values());

    // Send via Firebase
    const sentCount = await this.sendMulticastNotifications(fcmTokens, payload);

    return { sentCount };
  }

  /**
   * Send multicast notifications in batches of 500 (Firebase limit)
   */
  private async sendMulticastNotifications(
    fcmTokens: string[],
    payload: any,
  ): Promise<number> {
    let totalSent = 0;

    // Split into batches of 500 (Firebase multicast limit)
    for (let i = 0; i < fcmTokens.length; i += this.FCM_BATCH_LIMIT) {
      const batch = fcmTokens.slice(i, i + this.FCM_BATCH_LIMIT);

      const multicastMessage: MulticastMessage = {
        tokens: batch,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      try {
        const response =
          await this.firebasePushNotificationsService.sendMulticastNotification(
            multicastMessage,
          );

        if (response) {
          totalSent += response.successCount;
          this.logger.log(
            `Multicast batch: ${response.successCount} succeeded, ${response.failureCount} failed`,
          );

          // Log failures
          if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
              if (!resp.success && resp.error) {
                this.logger.debug(
                  `Failed to send to token ${batch[idx].substring(0, 10)}...: ${resp.error.message}`,
                );
              }
            });
          }
        }
      } catch (error) {
        this.logger.error('Multicast batch error:', error);
      }
    }

    return totalSent;
  }
}
