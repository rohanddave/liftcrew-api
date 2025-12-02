import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user info', () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const result = {
        access_token: 'mock-jwt-token',
        user: { id: '1', email: credentials.email },
      };
      jest.spyOn(service, 'login').mockReturnValue(result);
      expect(controller.login(credentials)).toBe(result);
    });
  });

  describe('register', () => {
    it('should register a new user', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };
      const result = {
        id: '1',
        email: registerDto.email,
        message: 'User registered successfully',
      };
      jest.spyOn(service, 'register').mockReturnValue(result);
      expect(controller.register(registerDto)).toBe(result);
    });
  });

  describe('refreshToken', () => {
    it('should return a new access token', () => {
      const body = { token: 'old-token' };
      const result = { access_token: 'new-mock-jwt-token' };
      jest.spyOn(service, 'refreshToken').mockReturnValue(result);
      expect(controller.refreshToken(body)).toBe(result);
    });
  });
});
