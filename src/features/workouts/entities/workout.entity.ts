import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/features/users/entities/user.entity';
import { WorkoutParticipant } from './workout-participant.entity';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: string;

  @OneToMany(() => WorkoutParticipant, (participant) => participant.workout)
  participants: WorkoutParticipant[];

  @OneToMany(() => WorkoutExercise, (exercise) => exercise.workout)
  exercises: WorkoutExercise[];

  @CreateDateColumn()
  createdAt: Date;
}
