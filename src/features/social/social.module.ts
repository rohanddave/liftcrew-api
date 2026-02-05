import { Module } from '@nestjs/common';
import { Neo4jModule } from 'src/infra/neo4j/neo4j.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follows } from './entities/follows.entity';
import { SocialService } from './services/social.service';
import { GraphFollowsRepository } from './repositories/graph-follows.repository';
import { RelationalFollowsRepository } from './repositories/relational-follows-repository';
import { FollowsController } from './controllers/follows.controller';
import { UsersModule } from '../users/users.module';

export interface SocialModuleOptions {
  type: 'graph' | 'relational';
  /** Set to true to register the controller (only do this once in app.module) */
  withController?: boolean;
}

@Module({})
export class SocialModule {
  static register(options: SocialModuleOptions) {
    return {
      module: SocialModule,
      imports: [...this.getImports(options)],
      controllers: options.withController ? [FollowsController] : [],
      providers: [
        SocialService,
        {
          provide: 'FOLLOWS_REPOSITORY',
          useClass:
            options.type === 'graph'
              ? GraphFollowsRepository
              : RelationalFollowsRepository,
        },
      ],
      exports: [SocialService],
    };
  }

  private static getImports(options: SocialModuleOptions) {
    const imports = [];
    imports.push(UsersModule.register({ searchProvider: 'relational' }));
    // Add imports based on the type of social module
    if (options.type === 'graph') {
      imports.push(Neo4jModule);
    } else if (options.type === 'relational') {
      imports.push(TypeOrmModule.forFeature([Follows]));
    }
    return imports;
  }
}
