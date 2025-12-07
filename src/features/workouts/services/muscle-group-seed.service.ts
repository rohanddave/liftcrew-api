import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MuscleGroup, MuscleGroupName, BodyRegion } from '../entities/muscle-group.entity';

/**
 * Service responsible for seeding muscle group data.
 * Runs on module initialization and is idempotent (safe to run multiple times).
 */
@Injectable()
export class MuscleGroupSeedService implements OnModuleInit {
  private readonly logger = new Logger(MuscleGroupSeedService.name);

  constructor(
    @InjectRepository(MuscleGroup)
    private readonly muscleGroupRepository: Repository<MuscleGroup>,
  ) {}

  /**
   * Runs automatically when the module is initialized.
   * Seeds muscle groups if they don't already exist.
   */
  async onModuleInit() {
    await this.seedMuscleGroups();
  }

  /**
   * Seeds all muscle groups defined in MuscleGroupName enum.
   * Skips creation if a muscle group with the same name already exists.
   */
  async seedMuscleGroups(): Promise<void> {
    this.logger.log('Starting muscle group seeding...');

    const muscleGroupsData = this.getMuscleGroupsData();
    let createdCount = 0;
    let skippedCount = 0;

    for (const data of muscleGroupsData) {
      const existing = await this.muscleGroupRepository.findOne({
        where: { name: data.name },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const muscleGroup = this.muscleGroupRepository.create(data);
      await this.muscleGroupRepository.save(muscleGroup);
      createdCount++;
    }

    this.logger.log(
      `Muscle group seeding completed. Created: ${createdCount}, Skipped: ${skippedCount}`,
    );
  }

  /**
   * Returns the mapping of muscle group names to their body regions.
   */
  private getMuscleGroupsData(): Array<{ name: MuscleGroupName; bodyRegion: BodyRegion }> {
    return [
      // Upper body muscle groups
      { name: MuscleGroupName.CHEST, bodyRegion: BodyRegion.UPPER },
      { name: MuscleGroupName.BACK, bodyRegion: BodyRegion.UPPER },
      { name: MuscleGroupName.SHOULDERS, bodyRegion: BodyRegion.UPPER },
      { name: MuscleGroupName.BICEPS, bodyRegion: BodyRegion.UPPER },
      { name: MuscleGroupName.TRICEPS, bodyRegion: BodyRegion.UPPER },
      { name: MuscleGroupName.FOREARMS, bodyRegion: BodyRegion.UPPER },
      { name: MuscleGroupName.TRAPS, bodyRegion: BodyRegion.UPPER },
      { name: MuscleGroupName.LATS, bodyRegion: BodyRegion.UPPER },

      // Lower body muscle groups
      { name: MuscleGroupName.QUADRICEPS, bodyRegion: BodyRegion.LOWER },
      { name: MuscleGroupName.HAMSTRINGS, bodyRegion: BodyRegion.LOWER },
      { name: MuscleGroupName.GLUTES, bodyRegion: BodyRegion.LOWER },
      { name: MuscleGroupName.CALVES, bodyRegion: BodyRegion.LOWER },
      { name: MuscleGroupName.HIP_FLEXORS, bodyRegion: BodyRegion.LOWER },
      { name: MuscleGroupName.ADDUCTORS, bodyRegion: BodyRegion.LOWER },
      { name: MuscleGroupName.ABDUCTORS, bodyRegion: BodyRegion.LOWER },

      // Core muscle groups
      { name: MuscleGroupName.ABS, bodyRegion: BodyRegion.CORE },
      { name: MuscleGroupName.OBLIQUES, bodyRegion: BodyRegion.CORE },
      { name: MuscleGroupName.LOWER_BACK, bodyRegion: BodyRegion.CORE },
    ];
  }
}
