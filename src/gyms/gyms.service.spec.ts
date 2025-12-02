import { Test, TestingModule } from '@nestjs/testing';
import { GymsService } from './gyms.service';

describe('GymsService', () => {
  let service: GymsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GymsService],
    }).compile();

    service = module.get<GymsService>(GymsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of gyms', () => {
      const result = service.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a gym by id', () => {
      const result = service.findOne('1');
      expect(result).toHaveProperty('id');
      expect(result.id).toBe('1');
      expect(result).toHaveProperty('name');
    });
  });

  describe('create', () => {
    it('should create a new gym', () => {
      const createGymDto = {
        name: 'Test Gym',
        location: 'Test City',
        address: '123 Test St',
      };
      const result = service.create(createGymDto);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createGymDto.name);
    });
  });

  describe('update', () => {
    it('should update a gym', () => {
      const updateGymDto = { name: 'Updated Gym' };
      const result = service.update('1', updateGymDto);
      expect(result.id).toBe('1');
      expect(result.name).toBe(updateGymDto.name);
    });
  });

  describe('remove', () => {
    it('should remove a gym', () => {
      const result = service.remove('1');
      expect(result.id).toBe('1');
      expect(result.deleted).toBe(true);
    });
  });
});
