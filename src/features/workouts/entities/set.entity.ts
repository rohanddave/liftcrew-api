import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';
import { WorkoutParticipant } from './workout-participant.entity';

export enum SetType {
  WARMUP = 'warmup',
  WORKING = 'working',
  DROPSET = 'dropset',
  FAILURE = 'failure',
}

@Entity('sets')
@Unique(['workoutExercise', 'participant', 'setNumber'])
export class ExerciseSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkoutExercise, (we) => we.sets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workout_exercise_id' })
  workoutExercise: WorkoutExercise;

  @Column({ name: 'workout_exercise_id' })
  workoutExerciseId: string;

  // Participant who performed this set
  @ManyToOne(() => WorkoutParticipant, (participant) => participant.sets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'participant_id' })
  participant: WorkoutParticipant;

  @Column({ name: 'participant_id' })
  participantId: string;

  @Column()
  setNumber: number;

  @Column({ type: 'enum', enum: SetType, default: SetType.WORKING })
  setType: SetType;

  // Performance data
  @Column({ nullable: true })
  reps?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, transformer: { from: (value) => value ? parseFloat(value) : null, to: (value) => value } })
  weightKg?: number;

  @Column({ nullable: true })
  durationSeconds?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: { from: (value) => value ? parseFloat(value) : null, to: (value) => value } })
  distanceMeters?: number;

  // Intensity
  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true, transformer: { from: (value) => value ? parseFloat(value) : null, to: (value) => value } })
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
