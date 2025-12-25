import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkoutParticipant } from 'src/features/workouts/entities/workout-participant.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  caption?: string;

  @ManyToOne(() => WorkoutParticipant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workout_participant_id' })
  workoutParticipant: WorkoutParticipant;

  @Column({ name: 'workout_participant_id' })
  workoutParticipantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
