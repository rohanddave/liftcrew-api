import { Neo4jService } from 'src/infra/neo4j/neo4j.service';
import { FollowsRepository } from './follows-repository.interface';
import { Injectable } from '@nestjs/common';

/**
 * Neo4j-based implementation of the FollowsRepository.
 * Manages follow relationships between users in a graph database.
 *
 * Graph Schema:
 * - Nodes: User { id: string, username: string }
 * - Relationships: (User)-[:FOLLOWS { since: Date }]->(User)
 */
@Injectable()
export class GraphFollowsRepository implements FollowsRepository {
  constructor(private neo4jService: Neo4jService) {}

  /**
   * Creates a follow relationship between two users in Neo4j.
   * Creates user nodes if they don't exist and establishes a FOLLOWS relationship.
   *
   * @param followerId - ID of the user who is following
   * @param followingId - ID of the user being followed
   */
  async create(followerId: string, followingId: string): Promise<void> {
    const query = `
      MERGE (follower:User {id: $followerId})
      MERGE (following:User {id: $followingId})
      MERGE (follower)-[r:FOLLOWS]->(following)
      ON CREATE SET r.since = datetime()
      RETURN r
    `;

    await this.neo4jService.write(query, {
      followerId,
      followingId,
    });
  }

  /**
   * Removes a follow relationship between two users.
   *
   * @param followerId - ID of the user who is following
   * @param followingId - ID of the user being followed
   */
  async delete(followerId: string, followingId: string): Promise<void> {
    const query = `
      MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(following:User {id: $followingId})
      DELETE r
    `;

    await this.neo4jService.write(query, {
      followerId,
      followingId,
    });
  }

  /**
   * Updates the close friend status on a follow relationship.
   * Note: This adds/removes an isCloseFriend property on the relationship.
   *
   * @param followerId - ID of the user who is following
   * @paramented.');
  }
  updateCloseFriendStatus(
    followerId: string,
    followingId: string,
    isCloseFriend: boolean,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  exists(followerId: string, followingId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  findOne(followerId: string, followingId: string): Promise<any | null> {
    throw new Error('Method not implemented.');
  }
  findFollowers(userId: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  findFollowing(userId: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  findMutualFollows(userId: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  getStats(
    userId: string,
  ): Promise<{ followerCount: number; followingCount: number }> {
    throw new Error('Method not implemented.');
  }
  deleteAllForUser(userId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
