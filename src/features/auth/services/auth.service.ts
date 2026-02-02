import { Injectable } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { NotificationsService } from 'src/features/notifications/services/notifications.service';

/**
 * Service responsible for authentication-related business logic.
 * Handles user authentication operations such as logout.
 */
@Injectable()
export class AuthService {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Logs out a user from the application.
   * Currently a placeholder for future logout logic such as:
   * - Token revocation
   * - Session cleanup
   * - Refresh token removal from database
   * @param user - The authenticated user to log out
   * @returns void
   */
  async logout(user: User): Promise<void> {
    await this.notificationsService.unregisterFcmToken(user.id);
    return;
  }
}
