import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';
import { User } from 'src/features/users/entities/user.entity';

export enum SetType {
  WARMUP = 'warmup',
  WORKING = 'working',
  DROPSET = 'dropset',
  FAILURE = 'failure',
}

@Entity('sets')
@Unique(['workoutExercise', 'performedBy', 'setNumber'])
export class ExerciseSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkoutExercise, (we) => we.sets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workout_exercise_id' })
  workoutExercise: WorkoutExercise;

  @Column({ name: 'workout_exercise_id' })
  workoutExerciseId: string;

  // Who performed this set (for group workouts)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'performed_by' })
  performedBy: User;

  @Column({ name: 'performed_by' })
  performedById: string;

  @Column()
  setNumber: number;

  @Column({ type: 'enum', enum: SetType, default: SetType.WORKING })
  setType: SetType;

  // Performance data
  @Column({ nullable: true })
  reps?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  weightKg?: number;

  @Column({ nullable: true })
  durationSeconds?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanceMeters?: number;

  // Intensity
  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rpe?: number;

  @Column({ nullable: true })
  tempo?: string;

  // Flags
  @Column({ default: false })
  isPr: boolean;

  @Column({ default: true })
  completed: boolean;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
