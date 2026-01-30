import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/features/users/entities/user.entity';
import { Post } from 'src/features/posts/entities/post.entity';
import { Kudos } from 'src/features/posts/entities/kudos.entity';

export enum FeedItemType {
  POST = 'post',
  KUDOS_GIVEN = 'kudos_given',
  KUDOS_RECEIVED = 'kudos_received',
}

@Entity('feed_items')
@Index(['userId', 'createdAt'])
@Index(['userId', 'itemType', 'createdAt'])
@Index(['postId', 'userId'])
export class FeedItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The user who owns this feed item (feed recipient)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  // The user who performed the action (post creator, kudos giver)
  @Column({ name: 'actor_id' })
  actorId: string;

  @Column({
    type: 'enum',
    enum: FeedItemType,
  })
  itemType: FeedItemType;

  // References to source entities
  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'post_id', nullable: true })
  postId: string;

  @ManyToOne(() => Kudos, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'kudos_id' })
  kudos: Kudos;

  @Column({ name: 'kudos_id', nullable: true })
  kudosId: string;

  // Timestamp from the original activity (post created, kudos given)
  @Column({ type: 'timestamp', name: 'activity_at' })
  activityAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
