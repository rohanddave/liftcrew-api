import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gym } from '../entities/gym.entity';
import { CreateGymDto } from '../dto/create-gym.dto';
import { UpdateGymDto } from '../dto/update-gym.dto';

@Injectable()
export class GymsService {
  constructor(
    @InjectRepository(Gym)
    private readonly gymRepository: Repository<Gym>,
  ) {}

  async findAll(): Promise<Gym[]> {
    return await this.gymRepository.find();
  }

  async findOne(id: string): Promise<Gym> {
    const gym = await this.gymRepository.findOne({ where: { id } });
    if (!gym) {
      throw new NotFoundException(`Gym with ID ${id} not found`);
    }
    return gym;
  }

  async create(createGymDto: CreateGymDto): Promise<Gym> {
    const gym = this.gymRepository.create(createGymDto);
    return await this.gymRepository.save(gym);
  }

  async update(id: string, updateGymDto: UpdateGymDto): Promise<Gym> {
    const gym = await this.findOne(id);
    Object.assign(gym, updateGymDto);
    return await this.gymRepository.save(gym);
  }

  async remove(id: string): Promise<void> {
    const gym = await this.findOne(id);
    await this.gymRepository.remove(gym);
  }
}
