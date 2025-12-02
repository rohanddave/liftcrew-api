import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { GymsService } from './gyms.service';

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
  create(@Body() createGymDto: any) {
    return this.gymsService.create(createGymDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateGymDto: any) {
    return this.gymsService.update(id, updateGymDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gymsService.remove(id);
  }
}
