import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthController } from './firebase-auth.controller';
import { FirebaseAuthService } from './firebase-auth.service';

describe('FirebaseAuthController', () => {
  let controller: FirebaseAuthController;
  let service: FirebaseAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FirebaseAuthController],
      providers: [
        FirebaseAuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FirebaseAuthController>(FirebaseAuthController);
    service = module.get<FirebaseAuthService>(FirebaseAuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('authenticateWithPhone', () => {
    it('should call verifyPhoneNumber', async () => {
      const phoneAuthDto = {
        phoneNumber: '+1234567890',
        verificationCode: '123456',
      };
      const result = {
        uid: 'test-uid',
        phoneNumber: '+1234567890',
        customToken: 'mock-token',
      };

      jest.spyOn(service, 'verifyPhoneNumber').mockResolvedValue(result);

      expect(await controller.authenticateWithPhone(phoneAuthDto)).toBe(result);
    });
  });

  describe('authenticateWithGoogle', () => {
    it('should call verifyGoogleAuth', async () => {
      const googleAuthDto = { idToken: 'google-token' };
      const result = {
        uid: 'test-uid',
        email: 'test@example.com',
        customToken: 'mock-token',
      };

      jest.spyOn(service, 'verifyGoogleAuth').mockResolvedValue(result);

      expect(await controller.authenticateWithGoogle(googleAuthDto)).toBe(
        result,
      );
    });
  });

  describe('authenticateWithApple', () => {
    it('should call verifyAppleAuth', async () => {
      const appleAuthDto = { idToken: 'apple-token', nonce: 'nonce' };
      const result = {
        uid: 'test-uid',
        email: 'test@example.com',
        customToken: 'mock-token',
      };

      jest.spyOn(service, 'verifyAppleAuth').mockResolvedValue(result);

      expect(await controller.authenticateWithApple(appleAuthDto)).toBe(result);
    });
  });
});
