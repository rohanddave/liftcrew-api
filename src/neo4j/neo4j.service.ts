import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('NEO4J_URI');
    const username = this.configService.get<string>('NEO4J_USERNAME');
    const password = this.configService.get<string>('NEO4J_PASSWORD');

    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 60000,
    });

    // Test connection with retry logic
    const maxRetries = 10;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await this.driver.verifyConnectivity();
        console.log('Neo4j connection established successfully');
        return;
      } catch (error) {
        retries++;
        console.log(
          `Failed to connect to Neo4j (attempt ${retries}/${maxRetries}), retrying in 3 seconds...`,
        );
        if (retries >= maxRetries) {
          console.error('Failed to connect to Neo4j after maximum retries');
          // Don't throw - allow app to start even if Neo4j is unavailable
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }

  getDriver(): Driver {
    return this.driver;
  }

  getSession(): Session {
    return this.driver.session();
  }

  async read(cypher: string, params?: any): Promise<any[]> {
    const session = this.getSession();
    try {
      const result = await session.executeRead((tx) =>
        tx.run(cypher, params),
      );
      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }

  async write(cypher: string, params?: any): Promise<any[]> {
    const session = this.getSession();
    try {
      const result = await session.executeWrite((tx) =>
        tx.run(cypher, params),
      );
      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }
}
