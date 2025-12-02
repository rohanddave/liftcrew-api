import {
  extractBearerToken,
  getBearerToken,
  tryExtractBearerToken,
} from './auth.utils';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('Auth Utils', () => {
  describe('extractBearerToken', () => {
    it('should extract token from valid Bearer authorization header', () => {
      const token = extractBearerToken('Bearer abc123token');
      expect(token).toBe('abc123token');
    });

    it('should extract token with extra spaces', () => {
      const token = extractBearerToken('  Bearer   abc123token  ');
      expect(token).toBe('abc123token');
    });

    it('should be case-insensitive for Bearer scheme', () => {
      const token1 = extractBearerToken('bearer abc123token');
      const token2 = extractBearerToken('BEARER abc123token');
      const token3 = extractBearerToken('BeArEr abc123token');

      expect(token1).toBe('abc123token');
      expect(token2).toBe('abc123token');
      expect(token3).toBe('abc123token');
    });

    it('should throw UnauthorizedException if header is missing', () => {
      expect(() => extractBearerToken(undefined)).toThrow(
        UnauthorizedException,
      );
      expect(() => extractBearerToken(undefined)).toThrow(
        'Authorization header is required',
      );
    });

    it('should return null if header is missing and throwIfMissing is false', () => {
      const token = extractBearerToken(undefined, { throwIfMissing: false });
      expect(token).toBeNull();
    });

    it('should throw BadRequestException if format is invalid', () => {
      expect(() => extractBearerToken('InvalidFormat')).toThrow(
        BadRequestException,
      );
      expect(() => extractBearerToken('Bearer')).toThrow(BadRequestException);
      expect(() => extractBearerToken('Bearer  ')).toThrow(BadRequestException);
      expect(() => extractBearerToken('Basic abc123')).toThrow(
        BadRequestException,
      );
    });

    it('should return null if format is invalid and throwIfMalformed is false', () => {
      const token1 = extractBearerToken('InvalidFormat', {
        throwIfMalformed: false,
      });
      const token2 = extractBearerToken('Basic abc123', {
        throwIfMalformed: false,
      });

      expect(token1).toBeNull();
      expect(token2).toBeNull();
    });

    it('should throw BadRequestException if token is empty', () => {
      expect(() => extractBearerToken('Bearer ')).toThrow(BadRequestException);
      expect(() => extractBearerToken('Bearer    ')).toThrow(
        BadRequestException,
      );
    });

    it('should handle long tokens', () => {
      const longToken = 'a'.repeat(1000);
      const token = extractBearerToken(`Bearer ${longToken}`);
      expect(token).toBe(longToken);
    });

    it('should handle JWT tokens', () => {
      const jwtToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const token = extractBearerToken(`Bearer ${jwtToken}`);
      expect(token).toBe(jwtToken);
    });
  });

  describe('getBearerToken', () => {
    it('should extract token from valid header', () => {
      const token = getBearerToken('Bearer abc123token');
      expect(token).toBe('abc123token');
    });

    it('should throw exception for invalid header', () => {
      expect(() => getBearerToken(undefined)).toThrow();
      expect(() => getBearerToken('InvalidFormat')).toThrow();
    });
  });

  describe('tryExtractBearerToken', () => {
    it('should extract token from valid header', () => {
      const token = tryExtractBearerToken('Bearer abc123token');
      expect(token).toBe('abc123token');
    });

    it('should return null for invalid header without throwing', () => {
      expect(tryExtractBearerToken(undefined)).toBeNull();
      expect(tryExtractBearerToken('InvalidFormat')).toBeNull();
      expect(tryExtractBearerToken('Basic abc123')).toBeNull();
      expect(tryExtractBearerToken('Bearer ')).toBeNull();
    });

    it('should not throw any exceptions', () => {
      expect(() => tryExtractBearerToken(undefined)).not.toThrow();
      expect(() => tryExtractBearerToken('InvalidFormat')).not.toThrow();
      expect(() => tryExtractBearerToken('Bearer')).not.toThrow();
    });
  });
});
