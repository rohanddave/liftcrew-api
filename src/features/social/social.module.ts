import { Module } from '@nestjs/common';
import { Neo4jModule } from 'src/infra/neo4j/neo4j.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follows } from './entities/follows.entity';
import { SocialService } from './services/social.service';
import { GraphFollowsRepository } from './repositories/graph-follows.repository';
import { RelationalFollowsRepository } from './repositories/relational-follows-repository';

export interface SocialModuleOptions {
  type: 'graph' | 'relational';
}

@Module({})
export class SocialModule {
  static register(options: SocialModuleOptions) {
    return {
      module: SocialModule,
      imports: [...this.getImports(options)],
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
    };
  }

  private static getImports(options: SocialModuleOptions) {
    const imports = [];
    // TODO: think about this - how to avoid circular dependencies when registering controller routes
    // imports.push(UsersModule);
    // Add imports based on the type of social module
    if (options.type === 'graph') {
      imports.push(Neo4jModule);
    } else if (options.type === 'relational') {
      // TODO: create entity for relational social features and add here
      imports.push(TypeOrmModule.forFeature([Follows]));
    }
    return imports;
  }
}
