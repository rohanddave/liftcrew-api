import { Test, TestingModule } from '@nestjs/testing';
import { GymsController } from './gyms.controller';
import { GymsService } from './gyms.service';

describe('GymsController', () => {
  let controller: GymsController;
  let service: GymsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GymsController],
      providers: [GymsService],
    }).compile();

    controller = module.get<GymsController>(GymsController);
    service = module.get<GymsService>(GymsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of gyms', () => {
      const result = [];
      jest.spyOn(service, 'findAll').mockReturnValue(result);
      expect(controller.findAll()).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should return a single gym', () => {
      const result = { id: '1', name: 'Gym', location: 'City' };
      jest.spyOn(service, 'findOne').mockReturnValue(result);
      expect(controller.findOne('1')).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a new gym', () => {
      const createGymDto = {
        name: 'Test Gym',
        location: 'Test City',
        address: '123 Test St',
      };
      const result = { id: '1', ...createGymDto };
      jest.spyOn(service, 'create').mockReturnValue(result);
      expect(controller.create(createGymDto)).toBe(result);
    });
  });

  describe('update', () => {
    it('should update a gym', () => {
      const updateGymDto = { name: 'Updated Gym' };
      const result = { id: '1', ...updateGymDto };
      jest.spyOn(service, 'update').mockReturnValue(result);
      expect(controller.update('1', updateGymDto)).toBe(result);
    });
  });

  describe('remove', () => {
    it('should remove a gym', () => {
      const result = { id: '1', deleted: true };
      jest.spyOn(service, 'remove').mockReturnValue(result);
      expect(controller.remove('1')).toBe(result);
    });
  });
});
