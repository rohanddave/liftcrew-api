import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthService } from '../../../infra/firebase/services/firebase-auth.service';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-tokens.entity';
import { createHash } from 'crypto';

interface TokenPayload {
  id: string;
  email?: string;
  phoneNumber?: string;
  name?: string;
  picture?: string;
  provider?: string;
  emailVerified?: boolean;
}

interface RefreshTokenPayload {
  id: string;
}

@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpirySeconds: number;
  private readonly refreshSecret: string;
  private readonly refreshExpirySeconds: number;

  private readonly issuer = 'liftcrew-api';
  private readonly audience = 'liftcrew-app';

  constructor(
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    this.jwtSecret = secret;

    const expiry = this.configService.get<number>('JWT_EXPIRY_SECONDS', 604800); // Default to 7 days
    this.jwtExpirySeconds = expiry;

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    this.refreshSecret = refreshSecret;

    const refreshExpiry = this.configService.get<number>(
      'JWT_REFRESH_EXPIRY_SECONDS',
      1209600,
    ); // Default to 14 days
    this.refreshExpirySeconds = refreshExpiry;
  }

  /**
   * Hashes a token using SHA-256.
   * Used to securely store refresh tokens in the database.
   * @param token - The token to hash
   * @returns The SHA-256 hash of the token
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates an access token with user information.
   * @param payload - The user payload to encode in the token
   * @returns The signed JWT access token
   */
  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpirySeconds,
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  /**
   * Generates a refresh token and stores its hash in the database.
   * @param payload - The refresh token payload containing user ID
   * @returns Promise<string> The signed JWT refresh token
   */
  private async generateRefreshToken(
    payload: RefreshTokenPayload,
  ): Promise<string> {
    // Generate the refresh token
    const refreshToken = jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpirySeconds,
      issuer: this.issuer,
      audience: this.audience,
    });

    // Hash the refresh token for secure storage
    const tokenHash = this.hashToken(refreshToken);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.refreshExpirySeconds);

    // Store the hashed token in the database
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: payload.id,
      tokenHash,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return refreshToken;
  }

  /**
   * Exchanges a Firebase ID token for application JWT tokens.
   * @param firebaseToken - The Firebase ID token to exchange
   * @returns Promise containing access_token and refresh_token
   */
  async exchangeFirebaseToken(
    firebaseToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    // Verify the Firebase token
    const decodedToken =
      await this.firebaseAuthService.verifyIdToken(firebaseToken);

    // Extract user information from the decoded token
    const payload: TokenPayload = {
      id: decodedToken.uid,
      email: decodedToken.email,
      phoneNumber: decodedToken.phone_number,
      name: decodedToken.name,
      picture: decodedToken.picture,
      provider: decodedToken.firebase?.sign_in_provider,
      emailVerified: decodedToken.email_verified,
    };

    // Generate application-specific JWT token
    const appToken = this.generateAccessToken(payload);

    // Generate and store refresh token
    const refreshPayload: RefreshTokenPayload = {
      id: decodedToken.uid,
    };

    const refreshToken = await this.generateRefreshToken(refreshPayload);

    return {
      access_token: appToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Refreshes an access token using a valid refresh token.
   * Validates the refresh token, checks if it exists and is not expired,
   * then generates a new access token.
   * @param refreshToken - The refresh token to validate
   * @returns Promise containing the new access_token
   * @throws UnauthorizedException if token is invalid, expired, or not found
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      // Verify the refresh token signature and expiration
      const decoded = jwt.verify(refreshToken, this.refreshSecret, {
        issuer: this.issuer,
        audience: this.audience,
      }) as RefreshTokenPayload;

      // Hash the provided token to compare with database
      const tokenHash = this.hashToken(refreshToken);

      // Find the refresh token in the database
      const storedToken = await this.refreshTokenRepository.findOne({
        where: {
          userId: decoded.id,
          tokenHash,
        },
      });

      // Validate token exists in database
      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        // Clean up expired token
        await this.refreshTokenRepository.remove(storedToken);
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Generate new access token with user information
      // Note: In a production system, you might want to fetch fresh user data here
      const payload: TokenPayload = {
        id: decoded.id,
      };

      const newAccessToken = this.generateAccessToken(payload);

      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw error;
    }
  }
}
