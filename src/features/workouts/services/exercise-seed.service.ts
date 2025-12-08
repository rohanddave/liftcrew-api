import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Exercise,
  ExerciseCategory,
  EquipmentType,
} from '../entities/exercise.entity';
import { MuscleGroup, MuscleGroupName } from '../entities/muscle-group.entity';

interface ExerciseData {
  name: string;
  category: ExerciseCategory;
  equipmentType?: EquipmentType;
  muscleGroups: MuscleGroupName[];
  description?: string;
}

/**
 * Service responsible for seeding exercise data.
 * Runs on module initialization and is idempotent (safe to run multiple times).
 */
@Injectable()
export class ExerciseSeedService implements OnModuleInit {
  private readonly logger = new Logger(ExerciseSeedService.name);

  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    @InjectRepository(MuscleGroup)
    private readonly muscleGroupRepository: Repository<MuscleGroup>,
  ) {}

  /**
   * Runs automatically when the module is initialized.
   * Seeds exercises if they don't already exist.
   */
  async onModuleInit() {
    await this.seedExercises();
  }

  /**
   * Seeds all exercises.
   * Skips creation if an exercise with the same name already exists.
   */
  async seedExercises(): Promise<void> {
    this.logger.log('Starting exercise seeding...');

    const exercisesData = this.getExercisesData();
    let createdCount = 0;
    let skippedCount = 0;

    for (const data of exercisesData) {
      const existing = await this.exerciseRepository.findOne({
        where: { name: data.name },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Fetch muscle groups for this exercise
      const muscleGroups = await this.muscleGroupRepository.find({
        where: data.muscleGroups.map((name) => ({ name })),
      });

      const exercise = this.exerciseRepository.create({
        name: data.name,
        category: data.category,
        equipmentType: data.equipmentType,
        description: data.description,
        muscleGroups,
      });

      await this.exerciseRepository.save(exercise);
      createdCount++;
    }

    this.logger.log(
      `Exercise seeding completed. Created: ${createdCount}, Skipped: ${skippedCount}`,
    );
  }

  /**
   * Returns all exercise data to be seeded.
   */
  private getExercisesData(): ExerciseData[] {
    return [
      // CHEST EXERCISES
      {
        name: 'Incline Dumbbell Bench Press',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.CHEST, MuscleGroupName.SHOULDERS, MuscleGroupName.TRICEPS],
      },
      {
        name: 'Decline Barbell Bench Press',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.BARBELL,
        muscleGroups: [MuscleGroupName.CHEST, MuscleGroupName.TRICEPS],
      },
      {
        name: 'Pec Dec Fly',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.CHEST],
      },
      {
        name: 'Cable Low to High Fly',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.CABLE,
        muscleGroups: [MuscleGroupName.CHEST],
      },
      {
        name: 'Cable Chest Fly',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.CABLE,
        muscleGroups: [MuscleGroupName.CHEST],
      },
      {
        name: 'Incline Dumbbell Fly',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.CHEST],
      },

      // TRICEPS EXERCISES
      {
        name: 'Overhead Dumbbell Extension',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.TRICEPS],
      },
      {
        name: 'Cable Rope Tricep Pushdown',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.CABLE,
        muscleGroups: [MuscleGroupName.TRICEPS],
      },
      {
        name: 'Bent Over Tricep Extension',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.TRICEPS],
      },

      // BACK EXERCISES
      {
        name: 'Lat Pulldown',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.CABLE,
        muscleGroups: [MuscleGroupName.LATS, MuscleGroupName.BACK, MuscleGroupName.BICEPS],
      },
      {
        name: 'V-Grip Lat Pulldown',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.CABLE,
        muscleGroups: [MuscleGroupName.LATS, MuscleGroupName.BACK, MuscleGroupName.BICEPS],
      },
      {
        name: 'Cable Rowing',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.CABLE,
        muscleGroups: [MuscleGroupName.BACK, MuscleGroupName.LATS, MuscleGroupName.BICEPS],
      },
      {
        name: 'Chest Supported Row Machine',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.BACK, MuscleGroupName.LATS, MuscleGroupName.BICEPS],
      },
      {
        name: 'Dumbbell Rows',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.BACK, MuscleGroupName.LATS, MuscleGroupName.BICEPS],
      },

      // BICEPS EXERCISES
      {
        name: 'Dumbbell Curl',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.BICEPS],
      },
      {
        name: 'Hammer Dumbbell Curl',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.BICEPS, MuscleGroupName.FOREARMS],
      },
      {
        name: 'Preacher Curl Machine',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.BICEPS],
      },
      {
        name: 'Bicep Curl Machine',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.BICEPS],
      },

      // SHOULDER EXERCISES
      {
        name: 'Seated Dumbbell Press',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.SHOULDERS, MuscleGroupName.TRICEPS],
      },
      {
        name: 'Behind the Neck Smith Machine Press',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.SHOULDERS, MuscleGroupName.TRICEPS],
      },
      {
        name: 'Barbell Upright Rows',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.BARBELL,
        muscleGroups: [MuscleGroupName.SHOULDERS, MuscleGroupName.TRAPS],
      },
      {
        name: 'Lateral Raise Machine',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.SHOULDERS],
      },
      {
        name: 'Lateral Raise Half Reps',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.SHOULDERS],
      },
      {
        name: 'Dumbbell Lateral Raise',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.SHOULDERS],
      },
      {
        name: 'Dumbbell Rear Delt Raise',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.SHOULDERS],
      },
      {
        name: 'Rear Delt Fly Pec Dec',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.SHOULDERS],
      },
      {
        name: 'Single Arm Rear Delt Fly',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.CABLE,
        muscleGroups: [MuscleGroupName.SHOULDERS],
      },
      {
        name: 'Dumbbell Shrugs',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.DUMBBELL,
        muscleGroups: [MuscleGroupName.TRAPS],
      },

      // LEG EXERCISES
      {
        name: 'Hack Squat',
        category: ExerciseCategory.COMPOUND,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.QUADRICEPS, MuscleGroupName.GLUTES, MuscleGroupName.HAMSTRINGS],
      },
      {
        name: 'Leg Extension',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.QUADRICEPS],
      },
      {
        name: 'Hamstring Curls',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.HAMSTRINGS],
      },
      {
        name: 'Calf Raises',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.CALVES],
      },

      // ABS EXERCISES
      {
        name: 'Weighted Crunches',
        category: ExerciseCategory.ISOLATION,
        equipmentType: EquipmentType.MACHINE,
        muscleGroups: [MuscleGroupName.ABS],
      },
    ];
  }
}
