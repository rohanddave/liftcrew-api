import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { Workout } from './workout.entity';
import { ExerciseSet } from './set.entity';
import { Exercise } from './exercise.entity';

@Entity('workout_exercises')
@Unique(['workout', 'orderIndex'])
export class WorkoutExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workout, (workout) => workout.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workout_id' })
  workout: Workout;

  @Column({ name: 'workout_id' })
  workoutId: string;

  @ManyToOne(() => Exercise)
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @Column({ name: 'exercise_id' })
  exerciseId: string;

  @Column()
  orderIndex: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true })
  restSeconds?: number;

  @OneToMany(() => ExerciseSet, (set) => set.workoutExercise)
  sets: ExerciseSet[];

  @CreateDateColumn()
  createdAt: Date;
}
