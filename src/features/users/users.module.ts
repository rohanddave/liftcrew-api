import { DynamicModule, Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import {
  ElasticsearchUsersSearchService,
  RelationalUsersSearchService,
  UserSearchService,
} from './services/users-search.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FirebaseModule } from 'src/infra/firebase/firebase.module';
import { Gym } from '../gyms/entities/gym.entity';

export type SearchProvider = 'relational' | 'elasticsearch';

interface UsersModuleOptions {
  searchProvider: SearchProvider;
}

/**
 * Users Module
 *
 * Handles all user-related functionality including:
 * - User profile management (CRUD operations)
 * - User authentication data (via Auth module)
 * - User-gym relationships (memberships, home gym)
 * - User physical metrics (height, weight, age calculated from birthdate)
 *
 * Exports:
 * - UsersService: For use in other modules that need user data access (e.g., AuthModule)
 */

@Module({})
export class UsersModule {
  static register(options: UsersModuleOptions): DynamicModule {
    const searchProvider = {
      provide: UserSearchService,
      useClass:
        options.searchProvider === 'elasticsearch'
          ? ElasticsearchUsersSearchService
          : RelationalUsersSearchService,
    };

    return {
      module: UsersModule,
      imports: [FirebaseModule, TypeOrmModule.forFeature([User, Gym])],
      controllers: [UsersController],
      providers: [UsersService, searchProvider],
      exports: [UsersService, UserSearchService],
    };
  }
}
