import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/features/users/entities/user.entity';
import { FollowStatus } from '../types';

/**
 * Junction table entity representing follow relationships between users.
 * Implements a many-to-many relationship where users can follow other users.
 * This is a self-referential many-to-many relationship on the User entity.
 */
@Entity('follows')
export class Follows {
  /**
   * Unique identifier for the follow relationship.
   * Auto-generated UUID.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the user who is following (the follower).
   * Foreign key to the users table.
   */
  @Column()
  followerId: string;

  /**
   * Relationship to the User entity representing the follower.
   * The user who initiated the follow action.
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  follower: User;

  /**
   * ID of the user who is being followed (the followee).
   * Foreign key to the users table.
   */
  @Column()
  followeeId: string;

  /**
   * Relationship to the User entity representing the followee.
   * The user who is being followed.
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followeeId' })
  followee: User;

  /**
   * Status of the follow request.
   * Can be 'pending', 'accepted', or 'rejected'.
   * Defaults to 'pending' when a follow request is created.
   */
  @Column({
    type: 'enum',
    enum: FollowStatus,
    default: FollowStatus.PENDING,
  })
  status: FollowStatus;

  /**
   * Timestamp when the follow relationship was created.
   * Automatically set when the record is created.
   */
  @CreateDateColumn()
  since: Date;

  /**
   * Timestamp when the follow relationship was last updated.
   * Automatically updated when the record is modified.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
