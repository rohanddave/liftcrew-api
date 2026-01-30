import { NotificationType, NotificationPayload } from '../types';

/**
 * Job data for fan-out notification to all followers
 */
export interface FanOutNotificationJobData {
  actorId: string; // User who triggered the notification
  type: NotificationType;
  entityId: string; // ID of the post, kudos, etc.
  entityType: string; // 'post', 'kudos', 'follow', etc.
  payload: NotificationPayload;
  targetUserIds?: string[]; // Optional: specific users instead of all followers
  batchSize?: number;
  estimatedTotal?: number; // For progress tracking
}

/**
 * Job data for sending notification to a single user
 */
export interface SendNotificationJobData {
  userId: string; // Recipient
  type: NotificationType;
  payload: NotificationPayload;
  entityId: string;
  entityType: string;
  actorId: string;
}
