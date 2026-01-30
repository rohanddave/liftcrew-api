import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Platform } from '../types';

@Entity('user_notification_settings')
@Index(['userId'], { unique: true })
export class UserNotificationSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ name: 'fcm_token_encrypted', type: 'text', nullable: true })
  fcmTokenEncrypted: string;

  @Column({
    type: 'enum',
    enum: Platform,
    nullable: true,
  })
  platform: Platform;

  @Column({ name: 'device_model', nullable: true })
  deviceModel: string;

  @Column('jsonb', {
    name: 'notification_preferences',
    default: {
      newPosts: true,
      kudos: true,
      followers: true,
      comments: true,
      mentions: true,
    },
  })
  notificationPreferences: {
    newPosts: boolean;
    kudos: boolean;
    followers: boolean;
    comments: boolean;
    mentions: boolean;
  };

  @Column({ name: 'last_active_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActiveAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
