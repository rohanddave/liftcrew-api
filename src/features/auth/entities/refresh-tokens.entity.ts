import { User } from 'src/features/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

/**
 * Entity representing refresh tokens stored in the database.
 * Refresh tokens are used to obtain new access tokens without re-authentication.
 * Tokens are stored as SHA-256 hashes for security.
 */
@Entity('refresh_tokens')
export class RefreshToken {
  /**
   * Unique identifier for the refresh token record.
   * Auto-generated UUID.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Email links the token to either:
   * - An existing user (via user.email)
   * - A pending user (before registration completes)
   */
  @Index()
  @Column()
  email: string;

  /**
   * SHA-256 hash of the refresh token.
   * The actual token is never stored in plain text for security.
   * Used to validate incoming refresh tokens against the database.
   */
  @Column()
  tokenHash: string;

  /**
   * Expiration timestamp for this refresh token.
   * Tokens past this date are considered invalid and should be removed.
   */
  @Column()
  expiresAt: Date;
}
