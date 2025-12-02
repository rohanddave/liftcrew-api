import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id, name: 'User' };
  }

  create(createUserDto: any) {
    return { id: '1', ...createUserDto };
  }

  update(id: string, updateUserDto: any) {
    return { id, ...updateUserDto };
  }

  remove(id: string) {
    return { id, deleted: true };
  }
}
