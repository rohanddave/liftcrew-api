import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', () => {
      const result = [];
      jest.spyOn(service, 'findAll').mockReturnValue(result);
      expect(controller.findAll()).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should return a single user', () => {
      const result = { id: '1', name: 'User' };
      jest.spyOn(service, 'findOne').mockReturnValue(result);
      expect(controller.findOne('1')).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a new user', () => {
      const createUserDto = { name: 'Test User', email: 'test@example.com' };
      const result = { id: '1', ...createUserDto };
      jest.spyOn(service, 'create').mockReturnValue(result);
      expect(controller.create(createUserDto)).toBe(result);
    });
  });

  describe('update', () => {
    it('should update a user', () => {
      const updateUserDto = { name: 'Updated User' };
      const result = { id: '1', ...updateUserDto };
      jest.spyOn(service, 'update').mockReturnValue(result);
      expect(controller.update('1', updateUserDto)).toBe(result);
    });
  });

  describe('remove', () => {
    it('should remove a user', () => {
      const result = { id: '1', deleted: true };
      jest.spyOn(service, 'remove').mockReturnValue(result);
      expect(controller.remove('1')).toBe(result);
    });
  });
});
