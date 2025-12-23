import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UsersSearchService } from '../services/users-search.service';
import {
  RequestWithEmail,
  RequestWithUser,
} from 'src/common/types/request.type';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Protected } from 'src/common/decorators';

/**
 * Controller for managing user-related operations.
 * Handles CRUD operations and authenticated user-specific endpoints.
 */
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersSearchService: UsersSearchService,
  ) {}

  /**
   * Searches for users by username.
   * @param username - The username query parameter to search for
   * @returns Promise<User[]> Array of users matching the search criteria
   */
  @Get('search')
  async search(
    @Req() request: RequestWithUser,
    @Query('username') username: string,
  ) {
    const { user } = request;
    const users = await this.usersSearchService.searchByUsername(username);
    // exclude current user
    // return users.filter((u) => u.id !== user.id);
    console.log('Searched users:', users);
    return users;
  }

  /**
   * Retrieves the currently authenticated user's profile.
   * Extracts user ID from the authenticated request context.
   * @param request - The request object containing authenticated user information
   * @returns Promise<User | null> The authenticated user's profile
   */
  @Get('me')
  async getMe(@Req() request: RequestWithUser) {
    return request.user;
  }

  /**
   * Retrieves a single user by their ID.
   * @param id - The UUID of the user to retrieve
   * @returns Promise<User | null> The user entity if found, null otherwise
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Creates a new user in the database.
   * @param createUserDto - The data transfer object containing user details
   * @returns Promise<User> The newly created user entity
   */
  @Protected()
  @Post()
  async create(
    @Req() request: RequestWithEmail,
    @Body() createUserDto: CreateUserDto,
  ) {
    const { email } = request;
    const createdUser = await this.usersService.create(createUserDto, email);
    return createdUser;
  }

  /**
   * Updates the authenticated user's profile information.
   * Extracts user ID from the authenticated request context.
   * @param request - The request object containing authenticated user information
   * @param updateUserDto - The data transfer object containing updated user details
   * @returns Promise<User> The updated user entity
   * @throws NotFoundException if the user is not found
   */
  @Put()
  async update(
    @Req() request: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(request.user.id, updateUserDto);
  }

  /**
   * Deletes the authenticated user's account.
   * Extracts user ID from the authenticated request context.
   * @param request - The request object containing authenticated user information
   * @returns Promise<void>
   * @throws NotFoundException if the user is not found
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() request: RequestWithUser) {
    return this.usersService.remove(request.user.id);
  }
}
