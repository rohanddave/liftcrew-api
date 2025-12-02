import { Injectable } from '@nestjs/common';

@Injectable()
export class GymsService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id, name: 'Gym', location: 'City' };
  }

  create(createGymDto: any) {
    return { id: '1', ...createGymDto };
  }

  update(id: string, updateGymDto: any) {
    return { id, ...updateGymDto };
  }

  remove(id: string) {
    return { id, deleted: true };
  }
}
