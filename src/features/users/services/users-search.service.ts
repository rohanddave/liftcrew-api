import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * Service responsible for searching users.
 */
@Injectable()
export class UsersSearchService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Searches for users by username.
   * Performs a case-insensitive partial match search.
   * @param username - The username to search for
   * @returns Promise<User[]> Array of users matching the search criteria
   */
  async searchByUsername(username: string): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        username: Like(`%${username}%`),
      },
    });
  }
}
