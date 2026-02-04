import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { RedisService } from 'src/infra/redis/redis.service';

export interface GymPresenceUser {
  userId: string;
  [key: string]: string | number; // flexible additional fields
}

@Injectable()
export class GymPresenceService {
  private readonly TTL_SECONDS = 14400; // 4 hours

  constructor(private readonly redisService: RedisService) {}

  private getActiveHashKey(gymId: string): string {
    return `gym:${gymId}:active`;
  }

  async checkIn(
    gymId: string,
    userId: string,
    userData: Record<string, string | number> = {},
  ): Promise<void> {
    try {
      const hashKey = this.getActiveHashKey(gymId);

      const payload: GymPresenceUser = {
        userId,
        ...userData,
      };

      await this.redisService.hset(hashKey, userId, JSON.stringify(payload));
      await this.redisService.expire(hashKey, this.TTL_SECONDS);
    } catch (error) {
      console.error('GymPresenceService.checkIn error:', error);
      throw new ServiceUnavailableException(
        'Presence service temporarily unavailable',
      );
    }
  }

  async checkOut(gymId: string, userId: string): Promise<void> {
    try {
      const hashKey = this.getActiveHashKey(gymId);
      await this.redisService.hdel(hashKey, userId);
    } catch (error) {
      console.error('GymPresenceService.checkOut error:', error);
      throw new ServiceUnavailableException(
        'Presence service temporarily unavailable',
      );
    }
  }

  async getActiveUserIds(gymId: string): Promise<string[]> {
    try {
      const hashKey = this.getActiveHashKey(gymId);
      return await this.redisService.hkeys(hashKey);
    } catch (error) {
      console.error('GymPresenceService.getActiveUserIds error:', error);
      throw new ServiceUnavailableException(
        'Presence service temporarily unavailable',
      );
    }
  }

  async getActiveUsers(gymId: string): Promise<GymPresenceUser[]> {
    try {
      const hashKey = this.getActiveHashKey(gymId);
      const data = await this.redisService.hgetall(hashKey);

      if (!data || Object.keys(data).length === 0) {
        return [];
      }

      return Object.values(data).map((value) => JSON.parse(value));
    } catch (error) {
      console.error('GymPresenceService.getActiveUsers error:', error);
      throw new ServiceUnavailableException(
        'Presence service temporarily unavailable',
      );
    }
  }

  async getActiveUsersByIds(
    gymId: string,
    userIds: string[],
  ): Promise<GymPresenceUser[]> {
    try {
      if (userIds.length === 0) return [];

      const hashKey = this.getActiveHashKey(gymId);
      const values = await this.redisService.hmget(hashKey, ...userIds);

      return values
        .filter((v): v is string => v !== null)
        .map((value) => JSON.parse(value));
    } catch (error) {
      console.error('GymPresenceService.getActiveUsersByIds error:', error);
      throw new ServiceUnavailableException(
        'Presence service temporarily unavailable',
      );
    }
  }

  async isUserCheckedIn(gymId: string, userId: string): Promise<boolean> {
    try {
      const hashKey = this.getActiveHashKey(gymId);
      const result = await this.redisService.hexists(hashKey, userId);
      return result === 1;
    } catch (error) {
      console.error('GymPresenceService.isUserCheckedIn error:', error);
      throw new ServiceUnavailableException(
        'Presence service temporarily unavailable',
      );
    }
  }
}
