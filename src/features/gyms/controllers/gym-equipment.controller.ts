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
  Query,
} from '@nestjs/common';
import { GymEquipmentService } from '../services/gym-equipment.service';
import { CreateGymEquipmentDto } from '../dto/create-gym-equipment.dto';
import { UpdateGymEquipmentDto } from '../dto/update-gym-equipment.dto';

/**
 * Controller for managing gym equipment operations.
 * Handles CRUD operations for gym equipment entities.
 */
@Controller('gym-equipment')
export class GymEquipmentController {
  constructor(private readonly gymEquipmentService: GymEquipmentService) {}

  /**
   * Retrieves all gym equipment from the database.
   * @returns Promise<GymEquipment[]> Array of all gym equipment entities
   */
  @Get()
  findAll(@Query('type') type?: string) {
    if (type) {
      return this.gymEquipmentService.findByType(type);
    }
    return this.gymEquipmentService.findAll();
  }

  /**
   * Retrieves a single gym equipment by its ID.
   * @param id - The UUID of the gym equipment to retrieve
   * @returns Promise<GymEquipment> The gym equipment entity
   * @throws NotFoundException if gym equipment with given ID is not found
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gymEquipmentService.findOneOrFail(id);
  }

  /**
   * Creates a new gym equipment in the database.
   * @param createGymEquipmentDto - The data transfer object containing gym equipment details
   * @returns Promise<GymEquipment> The newly created gym equipment entity
   */
  @Post()
  create(@Body() createGymEquipmentDto: CreateGymEquipmentDto) {
    return this.gymEquipmentService.create(createGymEquipmentDto);
  }

  /**
   * Updates an existing gym equipment's information.
   * @param id - The UUID of the gym equipment to update
   * @param updateGymEquipmentDto - The data transfer object containing updated gym equipment details
   * @returns Promise<GymEquipment> The updated gym equipment entity
   * @throws NotFoundException if gym equipment with given ID is not found
   */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateGymEquipmentDto: UpdateGymEquipmentDto,
  ) {
    return this.gymEquipmentService.update(id, updateGymEquipmentDto);
  }

  /**
   * Deletes a gym equipment from the database.
   * @param id - The UUID of the gym equipment to delete
   * @returns Promise<void>
   * @throws NotFoundException if gym equipment with given ID is not found
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.gymEquipmentService.remove(id);
  }
}
