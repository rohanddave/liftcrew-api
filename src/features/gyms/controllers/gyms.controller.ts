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

@Controller('gyms')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Get()
  findAll() {
    return this.gymsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gymsService.findOne(id);
  }

  @Post()
  create(@Body() createGymDto: CreateGymDto) {
    return this.gymsService.create(createGymDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateGymDto: UpdateGymDto) {
    return this.gymsService.update(id, updateGymDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.gymsService.remove(id);
  }
}
