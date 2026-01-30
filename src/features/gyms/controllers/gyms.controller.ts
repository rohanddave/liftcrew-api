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
} from '@nestjs/common';
import { GymsService } from '../services/gyms.service';
import { CreateGymDto } from '../dto/create-gym.dto';
import { UpdateGymDto } from '../dto/update-gym.dto';
import { Protected, Public } from 'src/common/decorators';

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
}
