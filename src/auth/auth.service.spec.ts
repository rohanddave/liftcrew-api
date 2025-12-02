import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user info', () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const result = service.login(credentials);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(credentials.email);
    });
  });

  describe('register', () => {
    it('should register a new user', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };
      const result = service.register(registerDto);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result.email).toBe(registerDto.email);
    });
  });

  describe('validateUser', () => {
    it('should validate user credentials', () => {
      const result = service.validateUser('test@example.com', 'password');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });
  });

  describe('refreshToken', () => {
    it('should return a new access token', () => {
      const result = service.refreshToken('old-token');
      expect(result).toHaveProperty('access_token');
    });
  });
});
