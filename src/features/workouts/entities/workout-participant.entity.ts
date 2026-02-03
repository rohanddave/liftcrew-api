import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
  AfterLoad,
} from 'typeorm';
import { User } from 'src/features/users/entities/user.entity';
import { Workout } from './workout.entity';
import { Gym } from 'src/features/gyms/entities/gym.entity';
import { ExerciseSet } from './set.entity';

export enum ParticipantRole {
  OWNER = 'owner',
  PARTICIPANT = 'participant',
  SPOTTER = 'spotter',
}

/**
 * Status of a workout participation
 */
export enum WorkoutParticipationStatus {
  SCHEDULED = 'scheduled',
  FINISHED = 'finished',
  MISSED = 'missed',
  IN_PROGRESS = 'in_progress',
}

@Entity('workout_participants')
@Unique(['workout', 'user'])
export class WorkoutParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workout, (workout) => workout.participants, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'workout_id' })
  workout: Workout;

  @Column({ name: 'workout_id' })
  workoutId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Gym, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gym_id' })
  gym?: Gym;

  @Column({ name: 'gym_id', nullable: true })
  gymId?: string;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.PARTICIPANT,
  })
  role: ParticipantRole;

  @Column({ type: 'timestamp', nullable: true })
  startAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt?: Date;

  status: WorkoutParticipationStatus;

  @AfterLoad()
  computeStatus() {
    const now = new Date();
    const WORKOUT_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours

    if (this.startAt && this.startAt > now) {
      this.status = WorkoutParticipationStatus.SCHEDULED;
    } else if (this.finishedAt) {
      this.status = WorkoutParticipationStatus.FINISHED;
    } else if (
      this.startAt &&
      now.getTime() - this.startAt.getTime() > WORKOUT_TIMEOUT_MS
    ) {
      this.status = WorkoutParticipationStatus.MISSED;
    } else {
      this.status = WorkoutParticipationStatus.IN_PROGRESS;
    }
  }

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  joinedAt: Date;

  @OneToMany(() => ExerciseSet, (set) => set.participant)
  sets: ExerciseSet[];
}
