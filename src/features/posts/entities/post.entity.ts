import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { WorkoutParticipant } from 'src/features/workouts/entities/workout-participant.entity';
import { User } from 'src/features/users/entities/user.entity';
import { Kudos } from './kudos.entity';

@Entity('posts')
@Unique(['workoutParticipant'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  caption?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: string;

  @ManyToOne(() => WorkoutParticipant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workout_participant_id' })
  workoutParticipant: WorkoutParticipant;

  @Column({ name: 'workout_participant_id' })
  workoutParticipantId: string;

  @OneToMany(() => Kudos, (kudos) => kudos.post)
  kudos: Kudos[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
