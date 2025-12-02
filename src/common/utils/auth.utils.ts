import { BadRequestException, UnauthorizedException } from '@nestjs/common';

/**
 * Extracts Bearer token from Authorization header
 * @param authorization - The Authorization header value
 * @param options - Optional configuration
 * @returns The extracted token
 * @throws BadRequestException if header is missing or malformed
 */
export function extractBearerToken(
  authorization: string | undefined,
  options?: {
    throwIfMissing?: boolean;
    throwIfMalformed?: boolean;
  },
): string | null {
  const { throwIfMissing = true, throwIfMalformed = true } = options || {};

  // Check if authorization header is present
  if (!authorization) {
    if (throwIfMissing) {
      throw new UnauthorizedException('Authorization header is required');
    }
    return null;
  }

  // Extract token from "Bearer <token>" format
  const parts = authorization.trim().split(' ');

  // Validate format
  if (parts.length !== 2) {
    if (throwIfMalformed) {
      throw new BadRequestException(
        'Authorization header must be in format: Bearer <token>',
      );
    }
    return null;
  }

  const [scheme, token] = parts;

  // Validate scheme (case-insensitive)
  if (scheme.toLowerCase() !== 'bearer') {
    if (throwIfMalformed) {
      throw new BadRequestException(
        'Authorization header must use Bearer scheme',
      );
    }
    return null;
  }

  // Validate token is not empty
  if (!token || token.trim().length === 0) {
    if (throwIfMalformed) {
      throw new BadRequestException('Token cannot be empty');
    }
    return null;
  }

  return token;
}

/**
 * Validates and extracts Bearer token from Authorization header
 * Alias for extractBearerToken with default options
 * @param authorization - The Authorization header value
 * @returns The extracted token
 * @throws UnauthorizedException or BadRequestException if validation fails
 */
export function getBearerToken(authorization: string | undefined): string {
  return extractBearerToken(authorization, {
    throwIfMissing: true,
    throwIfMalformed: true,
  })!;
}

/**
 * Safely extracts Bearer token without throwing exceptions
 * @param authorization - The Authorization header value
 * @returns The extracted token or null if invalid
 */
export function tryExtractBearerToken(
  authorization: string | undefined,
): string | null {
  return extractBearerToken(authorization, {
    throwIfMissing: false,
    throwIfMalformed: false,
  });
}
