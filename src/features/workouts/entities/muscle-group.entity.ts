import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Exercise } from './exercise.entity';

// Body regions
export enum BodyRegion {
  UPPER = 'upper',
  LOWER = 'lower',
  CORE = 'core',
  FULL_BODY = 'full_body',
}

// All muscle groups
export enum MuscleGroupName {
  // Upper body
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  FOREARMS = 'forearms',
  TRAPS = 'traps',
  LATS = 'lats',

  // Lower body
  QUADRICEPS = 'quadriceps',
  HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes',
  CALVES = 'calves',
  HIP_FLEXORS = 'hip_flexors',
  ADDUCTORS = 'adductors',
  ABDUCTORS = 'abductors',

  // Core
  ABS = 'abs',
  OBLIQUES = 'obliques',
  LOWER_BACK = 'lower_back',
}

@Entity('muscle_groups')
export class MuscleGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: BodyRegion })
  bodyRegion: BodyRegion;

  @Column({ type: 'enum', enum: MuscleGroupName, unique: true })
  name: MuscleGroupName;

  @ManyToMany(() => Exercise, (exercise) => exercise.muscleGroups)
  exercises: Exercise[];
}
