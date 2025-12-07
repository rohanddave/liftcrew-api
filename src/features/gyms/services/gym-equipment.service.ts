import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GymEquipment } from '../entities/gym-equipment.entity';
import { CreateGymEquipmentDto } from '../dto/create-gym-equipment.dto';
import { UpdateGymEquipmentDto } from '../dto/update-gym-equipment.dto';

/**
 * Service responsible for managing gym equipment business logic and database operations.
 */
@Injectable()
export class GymEquipmentService {
  constructor(
    @InjectRepository(GymEquipment)
    private readonly gymEquipmentRepository: Repository<GymEquipment>,
  ) {}

  /**
   * Create a new gym equipment.
   * @param createGymEquipmentDto - The data for creating gym equipment
   * @returns Promise<GymEquipment> The newly created equipment
   */
  async create(
    createGymEquipmentDto: CreateGymEquipmentDto,
  ): Promise<GymEquipment> {
    const equipment = this.gymEquipmentRepository.create(createGymEquipmentDto);
    return await this.gymEquipmentRepository.save(equipment);
  }

  /**
   * Retrieve all gym equipment.
   * @returns Promise<GymEquipment[]> Array of all gym equipment
   */
  async findAll(): Promise<GymEquipment[]> {
    return await this.gymEquipmentRepository.find();
  }

  /**
   * Find a single gym equipment by ID.
   * @param id - The UUID of the equipment
   * @returns Promise<GymEquipment> The equipment entity
   * @throws NotFoundException if equipment not found
   */
  async findOne(id: string): Promise<GymEquipment> {
    const equipment = await this.gymEquipmentRepository.findOne({
      where: { id },
      relations: ['gyms'],
    });

    if (!equipment) {
      throw new NotFoundException(`Gym equipment with ID ${id} not found`);
    }

    return equipment;
  }

  /**
   * Update an existing gym equipment.
   * @param id - The UUID of the equipment to update
   * @param updateGymEquipmentDto - The updated equipment data
   * @returns Promise<GymEquipment> The updated equipment entity
   * @throws NotFoundException if equipment not found
   */
  async update(
    id: string,
    updateGymEquipmentDto: UpdateGymEquipmentDto,
  ): Promise<GymEquipment> {
    const equipment = await this.findOne(id);
    Object.assign(equipment, updateGymEquipmentDto);
    return await this.gymEquipmentRepository.save(equipment);
  }

  /**
   * Remove a gym equipment from the database.
   * @param id - The UUID of the equipment to remove
   * @returns Promise<void>
   * @throws NotFoundException if equipment not found
   */
  async remove(id: string): Promise<void> {
    const equipment = await this.findOne(id);
    await this.gymEquipmentRepository.remove(equipment);
  }

  /**
   * Find equipment by type.
   * @param type - The type of equipment to search for
   * @returns Promise<GymEquipment[]> Array of equipment matching the type
   */
  async findByType(type: string): Promise<GymEquipment[]> {
    return await this.gymEquipmentRepository.find({
      where: { type },
    });
  }
}
