import { SocialTokenGuard } from './social-token.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('SocialTokenGuard', () => {
  let guard: SocialTokenGuard;

  beforeEach(() => {
    guard = new SocialTokenGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true and attach token to request for valid Bearer token', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token-123',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest['socialToken']).toBe('valid-token-123');
    });

    it('should attach JWT token to request', () => {
      const jwtToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

      const mockRequest = {
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest['socialToken']).toBe(jwtToken);
    });

    it('should throw UnauthorizedException if authorization header is missing', () => {
      const mockRequest = {
        headers: {},
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if authorization format is invalid', () => {
      const mockRequest = {
        headers: {
          authorization: 'InvalidFormat',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if Bearer scheme is missing', () => {
      const mockRequest = {
        headers: {
          authorization: 'Basic some-token',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is empty', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer ',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should handle Bearer with different casing', () => {
      const mockRequest = {
        headers: {
          authorization: 'bearer lowercase-token',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest['socialToken']).toBe('lowercase-token');
    });
  });
});
