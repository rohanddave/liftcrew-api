import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MuscleGroup } from './muscle-group.entity';

export enum ExerciseCategory {
  COMPOUND = 'compound',
  ISOLATION = 'isolation',
  CARDIO = 'cardio',
  MOBILITY = 'mobility',
}

export enum EquipmentType {
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  MACHINE = 'machine',
  CABLE = 'cable',
  BODYWEIGHT = 'bodyweight',
  KETTLEBELL = 'kettlebell',
  BAND = 'band',
}

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ExerciseCategory })
  category: ExerciseCategory;

  @Column({ type: 'enum', enum: EquipmentType, nullable: true })
  equipmentType?: EquipmentType;

  @ManyToMany(() => MuscleGroup, (muscle) => muscle.exercises)
  @JoinTable({
    name: 'exercise_muscles',
    joinColumn: { name: 'exercise_id' },
    inverseJoinColumn: { name: 'muscle_group_id' },
  })
  muscleGroups: MuscleGroup[];
}
