import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { GymsService } from '../services/gyms.service';
import { CreateGymDto } from '../dto/create-gym.dto';
import { UpdateGymDto } from '../dto/update-gym.dto';
import { CheckInDto } from '../dto/check-in.dto';
import { Protected, Public } from 'src/common/decorators';
import { RequestWithUser } from 'src/common/types/request.type';

/**
 * Controller for managing gym-related operations.
 * Handles CRUD operations for gym entities.
 */
@Controller('gyms')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  /**
   * Retrieves all gyms from the database.
   * @returns Promise<Gym[]> Array of all gym entities
   */
  @Protected()
  @Get()
  findAll() {
    return this.gymsService.findAll();
  }

  /**
   * Retrieves a single gym by its ID.
   * @param id - The UUID of the gym to retrieve
   * @returns Promise<Gym> The gym entity
   * @throws NotFoundException if gym with given ID is not found
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gymsService.findOne(id);
  }

  /**
   * Creates a new gym in the database.
   * @param createGymDto - The data transfer object containing gym details
   * @returns Promise<Gym> The newly created gym entity
   */
  @Post()
  @Public()
  create(@Body() createGymDto: CreateGymDto) {
    return this.gymsService.create(createGymDto);
  }

  /**
   * Updates an existing gym's information.
   * @param id - The UUID of the gym to update
   * @param updateGymDto - The data transfer object containing updated gym details
   * @returns Promise<Gym> The updated gym entity
   * @throws NotFoundException if gym with given ID is not found
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() updateGymDto: UpdateGymDto) {
    return this.gymsService.update(id, updateGymDto);
  }

  /**
   * Deletes a gym from the database.
   * @param id - The UUID of the gym to delete
   * @returns Promise<void>
   * @throws NotFoundException if gym with given ID is not found
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.gymsService.remove(id);
  }

  /**
   * Check in at the user's home gym.
   * Validates that the user's location is within threshold distance from their home gym.
   * If valid, queues notifications to all followers.
   * @param req - The request object containing the authenticated user
   * @param checkInDto - The data transfer object containing lat/lng coordinates
   * @returns Promise<{ success: boolean; message: string; gym?: Gym }>
   * @throws BadRequestException if user has no home gym or is too far away
   */
  @Post('check-in')
  async checkIn(@Req() req: RequestWithUser, @Body() checkInDto: CheckInDto) {
    const result = await this.gymsService.checkIn(
      req.user.id,
      checkInDto.lat,
      checkInDto.lng,
    );
    console.log('Check-in result:', result);
    return result;
  }

  /**
   * Check out from a gym.
   * @param req - The request object containing the authenticated user
   * @param gymId - The UUID of the gym to check out from
   * @returns Promise<{ success: boolean; message: string }>
   * @throws NotFoundException if gym doesn't exist
   * @throws BadRequestException if user is not checked in at this gym
   */
  @Post(':id/check-out')
  async checkOut(@Req() req: RequestWithUser, @Param('id') gymId: string) {
    return this.gymsService.checkOut(gymId, req.user.id);
  }

  /**
   * Get active followers at a specific gym.
   * Returns users who the requesting user follows AND who are currently checked in.
   * @param req - The request object containing the authenticated user
   * @param gymId - The UUID of the gym
   * @returns Promise<ActiveFollower[]>
   * @throws NotFoundException if gym doesn't exist
   */
  @Get(':id/followers-active')
  async getActiveFollowers(
    @Req() req: RequestWithUser,
    @Param('id') gymId: string,
  ) {
    return this.gymsService.getActiveFollowers(gymId, req.user.id);
  }
}
