import { NotificationType } from '../types';

/**
 * Base event interface for all notification events
 */
export interface NotificationEvent {
  actorId: string; // User who performed the action
  type: NotificationType;
}

/**
 * Event emitted when a new post is created
 */
export interface PostCreatedEvent extends NotificationEvent {
  type: NotificationType.NEW_POST;
  postId: string;
  caption?: string;
}

/**
 * Event emitted when kudos is given on a post
 */
export interface KudosReceivedEvent extends NotificationEvent {
  type: NotificationType.KUDOS_RECEIVED;
  kudosId: string;
  postId: string;
  postCreatorId: string; // User who created the post
}

/**
 * Event emitted when a user starts following another user
 */
export interface NewFollowerEvent extends NotificationEvent {
  type: NotificationType.NEW_FOLLOWER;
  followerId: string; // User who followed
  followeeId: string; // User being followed
}

/**
 * Event emitted when a follow request is accepted
 */
export interface FollowAcceptedEvent extends NotificationEvent {
  type: NotificationType.FOLLOW_ACCEPTED;
  followerId: string;
  followeeId: string;
}

/**
 * Union type of all notification events
 */
export type AnyNotificationEvent =
  | PostCreatedEvent
  | KudosReceivedEvent
  | NewFollowerEvent
  | FollowAcceptedEvent;

/**
 * Event names for EventEmitter2
 */
export const NOTIFICATION_EVENTS = {
  POST_CREATED: 'notification.post.created',
  KUDOS_RECEIVED: 'notification.kudos.received',
  NEW_FOLLOWER: 'notification.follower.new',
  FOLLOW_ACCEPTED: 'notification.follower.accepted',
} as const;
