import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Column,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from 'src/features/users/entities/user.entity';

export enum KudosState {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('kudos')
@Unique(['post', 'givenBy'])
export class Kudos {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, (post) => post.kudos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'post_id' })
  postId: string;

  @Column({ type: 'enum', enum: KudosState, default: KudosState.PROCESSING })
  state: KudosState;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'given_by' })
  givenBy: User;

  @Column({ name: 'given_by' })
  givenById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
