import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { RequestWithUser } from 'src/common/types/request.type';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() request: RequestWithUser) {
    return this.usersService.findOne(request.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put()
  update(@Req() request: RequestWithUser, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(request.user.id, updateUserDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() request: RequestWithUser) {
    return this.usersService.remove(request.user.id);
  }
}
