import { Neo4jService } from 'src/infra/neo4j/neo4j.service';
import {
  FollowsRepository,
  FollowRelationship,
  FollowerResult,
} from './follows-repository.interface';
import { Injectable } from '@nestjs/common';
import { FollowStatus } from '../types';
import { int } from 'neo4j-driver';

/**
 * Neo4j-based implementation of the FollowsRepository.
 * Manages follow relationships between users in a graph database.
 *
 * Graph Schema:
 * - Nodes: User { id: string, username: string }
 * - Relationships: (User)-[:FOLLOWS { status: string, since: Date }]->(User)
 */
@Injectable()
export class GraphFollowsRepository implements FollowsRepository {
  constructor(private neo4jService: Neo4jService) {}
  /**
   * Creates a follow request between two users with pending status.
   */
  async create(followerId: string, followingId: string): Promise<void> {
    const query = `
      MERGE (follower:User {id: $followerId})
      MERGE (following:User {id: $followingId})
      MERGE (follower)-[r:FOLLOWS]->(following)
      ON CREATE SET r.since = datetime(), r.status = $status
      RETURN r
    `;

    await this.neo4jService.write(query, {
      followerId,
      followingId,
      status: FollowStatus.PENDING,
    });
  }

  /**
   * Accept a follow request by updating the status to accepted.
   */
  async acceptFollowRequest(
    followerId: string,
    followeeId: string,
  ): Promise<void> {
    const query = `
      MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followee:User {id: $followeeId})
      SET r.status = $status
      RETURN r
    `;

    await this.neo4jService.write(query, {
      followerId,
      followeeId,
      status: FollowStatus.ACCEPTED,
    });
  }

  /**
   * Reject a follow request by updating the status to rejected.
   */
  async rejectFollowRequest(
    followerId: string,
    followeeId: string,
  ): Promise<void> {
    const query = `
      MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followee:User {id: $followeeId})
      SET r.status = $status
      RETURN r
    `;

    await this.neo4jService.write(query, {
      followerId,
      followeeId,
      status: FollowStatus.REJECTED,
    });
  }

  /**
   * Removes a follow relationship between two users.
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
   * Check if a follow relationship exists.
   */
  async exists(followerId: string, followingId: string): Promise<boolean> {
    const query = `
      MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(following:User {id: $followingId})
      RETURN count(r) > 0 as exists
    `;

    const result = await this.neo4jService.read(query, {
      followerId,
      followingId,
    });

    return result[0]?.exists || false;
  }

  /**
   * Get a specific follow relationship.
   */
  async findOne(
    followerId: string,
    followingId: string,
  ): Promise<FollowRelationship | null> {
    const query = `
      MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(following:User {id: $followingId})
      RETURN follower.id as followerId, following.id as followeeId, r.status as status, r.since as since
    `;

    const result = await this.neo4jService.read(query, {
      followerId,
      followingId,
    });

    if (result.length === 0) {
      return null;
    }

    const record = result[0];
    return {
      followerId: record.followerId,
      followeeId: record.followeeId,
      status: record.status,
      since: new Date(record.since),
    };
  }

  /**
   * Find users who follow the given user (with pagination).
   */
  async findFollowers(
    userId: string,
    page: number,
    limit: number,
    status?: FollowStatus,
  ): Promise<{ data: FollowerResult[]; total: number }> {
    // Convert to Neo4j integers to avoid BigInt mixing errors
    const skip = int((page - 1) * limit);
    const intLimit = int(limit);
    const statusFilter = status ? 'AND r.status = $status' : '';

    const query = `
      MATCH (follower:User)-[r:FOLLOWS]->(user:User {id: $userId})
      WHERE 1=1 ${statusFilter}
      RETURN follower.id as userId, follower.username as username,
             follower.name as name, follower.imageUrl as imageUrl,
             r.status as status, r.since as since
      ORDER BY r.since DESC
      SKIP $skip
      LIMIT $limit
    `;

    const countQuery = `
      MATCH (follower:User)-[r:FOLLOWS]->(user:User {id: $userId})
      WHERE 1=1 ${statusFilter}
      RETURN count(follower) as total
    `;

    const [results, countResults] = await Promise.all([
      this.neo4jService.read(query, { userId, status, skip, limit: intLimit }),
      this.neo4jService.read(countQuery, { userId, status }),
    ]);

    const data = results.map((record) => ({
      userId: record.userId,
      username: record.username,
      name: record.name,
      imageUrl: record.imageUrl,
      status: record.status,
      since: new Date(record.since),
    }));

    return {
      data,
      total: Number(countResults[0]?.total || 0),
    };
  }

  /**
   * Find users the given user follows (with pagination).
   */
  async findFollowing(
    userId: string,
    page: number,
    limit: number,
    status?: FollowStatus,
  ): Promise<{ data: FollowerResult[]; total: number }> {
    // Convert to Neo4j integers to avoid BigInt mixing errors
    const skip = int((page - 1) * limit);
    const intLimit = int(limit);
    const statusFilter = status ? 'AND r.status = $status' : '';

    const query = `
      MATCH (user:User {id: $userId})-[r:FOLLOWS]->(following:User)
      WHERE 1=1 ${statusFilter}
      RETURN following.id as userId, following.username as username,
             following.name as name, following.imageUrl as imageUrl,
             r.status as status, r.since as since
      ORDER BY r.since DESC
      SKIP $skip
      LIMIT $limit
    `;

    const countQuery = `
      MATCH (user:User {id: $userId})-[r:FOLLOWS]->(following:User)
      WHERE 1=1 ${statusFilter}
      RETURN count(following) as total
    `;

    const [results, countResults] = await Promise.all([
      this.neo4jService.read(query, { userId, status, skip, limit: intLimit }),
      this.neo4jService.read(countQuery, { userId, status }),
    ]);

    const data = results.map((record) => ({
      userId: record.userId,
      username: record.username,
      name: record.name,
      imageUrl: record.imageUrl,
      status: record.status,
      since: new Date(record.since),
    }));

    return {
      data,
      total: Number(countResults[0]?.total || 0),
    };
  }

  /**
   * Find users who mutually follow each other.
   */
  async findMutualFollows(userId: string): Promise<any[]> {
    const query = `
      MATCH (user:User {id: $userId})-[r1:FOLLOWS]->(other:User)-[r2:FOLLOWS]->(user)
      WHERE r1.status = $acceptedStatus AND r2.status = $acceptedStatus
      RETURN other.id as userId, other.username as username,
             other.name as name, other.imageUrl as imageUrl,
             r1.since as since
      ORDER BY r1.since DESC
    `;

    const results = await this.neo4jService.read(query, {
      userId,
      acceptedStatus: FollowStatus.ACCEPTED,
    });

    return results.map((record) => ({
      userId: record.userId,
      username: record.username,
      name: record.name,
      imageUrl: record.imageUrl,
      since: new Date(record.since),
    }));
  }

  /**
   * Get follower and following counts.
   */
  async getStats(userId: string): Promise<{
    followerCount: number;
    followingCount: number;
    pendingRequestsCount: number;
  }> {
    const query = `
      MATCH (user:User {id: $userId})
      OPTIONAL MATCH (follower:User)-[r1:FOLLOWS]->(user)
      WHERE r1.status = $acceptedStatus
      OPTIONAL MATCH (user)-[r2:FOLLOWS]->(following:User)
      WHERE r2.status = $acceptedStatus
      OPTIONAL MATCH (pending:User)-[r3:FOLLOWS]->(user)
      WHERE r3.status = $pendingStatus
      RETURN count(DISTINCT follower) as followerCount,
             count(DISTINCT following) as followingCount,
             count(DISTINCT pending) as pendingRequestsCount
    `;

    const result = await this.neo4jService.read(query, {
      userId,
      acceptedStatus: FollowStatus.ACCEPTED,
      pendingStatus: FollowStatus.PENDING,
    });

    return {
      followerCount: result[0]?.followerCount || 0,
      followingCount: result[0]?.followingCount || 0,
      pendingRequestsCount: result[0]?.pendingRequestsCount || 0,
    };
  }

  /**
   * Update the close friend status (not implemented for MVP).
   */
  async updateCloseFriendStatus(
    _followerId: string,
    _followingId: string,
    _isCloseFriend: boolean,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * Remove all relationships for a user (when deleting account).
   */
  async deleteAllForUser(userId: string): Promise<void> {
    const query = `
      MATCH (user:User {id: $userId})-[r:FOLLOWS]-()
      DELETE r
    `;

    await this.neo4jService.write(query, { userId });
  }
}
