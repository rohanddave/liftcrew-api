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
 * Event emitted when a follow request is received
 */
export interface FollowRequestEvent extends NotificationEvent {
  type: NotificationType.FOLLOW_REQUEST;
  followerId: string; // User who sent the request
  followeeId: string; // User receiving the request
}

/**
 * Event emitted when a follow request is accepted
 */
export interface FollowAcceptedEvent extends NotificationEvent {
  type: NotificationType.FOLLOW_ACCEPTED;
  followerId: string; // User who sent the original request
  followeeId: string; // User who accepted the request
}

/**
 * Event emitted when a user checks in at their gym
 */
export interface GymCheckInEvent extends NotificationEvent {
  type: NotificationType.GYM_CHECK_IN;
  gymId: string;
  gymName: string;
}

/**
 * Union type of all notification events
 */
export type AnyNotificationEvent =
  | PostCreatedEvent
  | KudosReceivedEvent
  | FollowRequestEvent
  | FollowAcceptedEvent
  | GymCheckInEvent;

/**
 * Event names for EventEmitter2
 */
export const NOTIFICATION_EVENTS = {
  POST_CREATED: 'notification.post.created',
  KUDOS_RECEIVED: 'notification.kudos.received',
  FOLLOW_REQUEST: 'notification.follower.request',
  FOLLOW_ACCEPTED: 'notification.follower.accepted',
  GYM_CHECK_IN: 'notification.gym.checkin',
} as const;
