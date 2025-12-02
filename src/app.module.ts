import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './features/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { FirebaseModule } from './infra/firebase/firebase.module';
import { GymsModule } from './features/gyms/gyms.module';
import { Module } from '@nestjs/common';
import { Neo4jModule } from './infra/neo4j/neo4j.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './features/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: parseInt(configService.get<string>('DATABASE_PORT')),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    Neo4jModule,
    FirebaseModule,
    AuthModule,
    UsersModule,
    GymsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
