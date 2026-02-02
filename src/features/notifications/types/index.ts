export enum NotificationType {
  NEW_POST = 'new_post',
  KUDOS_RECEIVED = 'kudos_received',
  KUDOS_ON_POST = 'kudos_on_post',
  NEW_FOLLOWER = 'new_follower',
  FOLLOW_REQUEST = 'follow_request',
  FOLLOW_ACCEPTED = 'follow_accepted',
  COMMENT = 'comment',
  MENTION = 'mention',
  GYM_CHECK_IN = 'gym_check_in',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

/**
 * Notification payload for Firebase messages
 */
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}
