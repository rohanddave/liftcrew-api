import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', () => {
      const result = service.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', () => {
      const result = service.findOne('1');
      expect(result).toHaveProperty('id');
      expect(result.id).toBe('1');
    });
  });

  describe('create', () => {
    it('should create a new user', () => {
      const createUserDto = { name: 'Test User', email: 'test@example.com' };
      const result = service.create(createUserDto);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createUserDto.name);
    });
  });

  describe('update', () => {
    it('should update a user', () => {
      const updateUserDto = { name: 'Updated User' };
      const result = service.update('1', updateUserDto);
      expect(result.id).toBe('1');
      expect(result.name).toBe(updateUserDto.name);
    });
  });

  describe('remove', () => {
    it('should remove a user', () => {
      const result = service.remove('1');
      expect(result.id).toBe('1');
      expect(result.deleted).toBe(true);
    });
  });
});
