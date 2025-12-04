import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthService } from '../firebase-auth.service';

describe('FirebaseAuthService', () => {
  let service: FirebaseAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'FIREBASE_SERVICE_ACCOUNT') {
                return undefined; // Mock no config for testing
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FirebaseAuthService>(FirebaseAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should warn when Firebase credentials are not configured', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      await service.onModuleInit();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'FIREBASE_SERVICE_ACCOUNT not configured. Firebase services will not be available.',
      );
      consoleWarnSpy.mockRestore();
    });
  });
});
