import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { SearchUsersDto } from '../dto/search-users.dto';
import { paginate, PaginatedResult } from 'src/common/pagination';

export abstract class UserSearchService {
  abstract searchByUsername(
    searchUsersDto: SearchUsersDto,
  ): Promise<PaginatedResult<User>>;
}

/**
 * Service responsible for searching users using relational database queries.
 */
@Injectable()
export class RelationalUsersSearchService extends UserSearchService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  /**
   * Searches for users by username.
   * Performs a case-insensitive partial match search.
   * @param username - The username to search for
   * @returns Promise<User[]> Array of users matching the search criteria
   */
  async searchByUsername(
    searchUsersDto: SearchUsersDto,
  ): Promise<PaginatedResult<User>> {
    return paginate(this.userRepository, searchUsersDto, {
      where: {
        username: Like(`%${searchUsersDto.query}%`),
      },
    });
  }
}

/**
 * Service responsible for searching users using relational database queries.
 */
@Injectable()
export class ElasticsearchUsersSearchService extends UserSearchService {
  constructor() {
    super();
  }

  /**
   * Searches for users by username.
   * Performs a case-insensitive partial match search.
   * @param username - The username to search for
   * @returns Promise<User[]> Array of users matching the search criteria
   */
  async searchByUsername(searchUsersDto: SearchUsersDto): Promise<PaginatedResult<User>> {
    throw new NotImplementedException(
      'Elasticsearch user search not implemented yet',
    );
  }
}
