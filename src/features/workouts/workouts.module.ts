import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MuscleGroup } from './entities/muscle-group.entity';
import { Exercise } from './entities/exercise.entity';
import { ExerciseSet } from './entities/set.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { WorkoutParticipant } from './entities/workout-participant.entity';
import { Workout } from './entities/workout.entity';
import { ExercisesService } from './services/exercises.service';
import { ExercisesController } from './controllers/exercises.controller';
import { MuscleGroupSeedService } from './services/muscle-group-seed.service';
import { ExerciseSeedService } from './services/exercise-seed.service';
import { WorkoutsService } from './services/workouts.service';
import { WorkoutsController } from './controllers/workouts.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule.register({ searchProvider: 'relational' }),
    TypeOrmModule.forFeature([
      MuscleGroup,
      Exercise,
      ExerciseSet,
      WorkoutExercise,
      WorkoutParticipant,
      Workout,
    ]),
  ],
  controllers: [ExercisesController, WorkoutsController],
  providers: [
    ExercisesService,
    WorkoutsService,
    MuscleGroupSeedService,
    ExerciseSeedService,
  ],
  exports: [ExercisesService, WorkoutsService],
})
export class WorkoutsModule {}
