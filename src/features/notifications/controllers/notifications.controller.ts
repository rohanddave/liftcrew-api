import {
  Controller,
  Post,
  Delete,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { RegisterFcmTokenDto } from '../dto/register-fcm-token.dto';
import { RequestWithUser } from 'src/common/types/request.type';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * Register or update user's FCM device token
   * @param req - Request with authenticated user
   * @param dto - FCM token registration data
   */
  @Post('register-token')
  @HttpCode(HttpStatus.OK)
  async registerToken(
    @Req() req: RequestWithUser,
    @Body() dto: RegisterFcmTokenDto,
  ) {
    const userId = req.user.id;

    await this.notificationsService.registerFcmToken(userId, dto.fcmToken);

    return {
      success: true,
      message: 'FCM token registered successfully',
    };
  }

  /**
   * Unregister user's FCM token
   * @param req - Request with authenticated user
   */
  @Delete('unregister-token')
  @HttpCode(HttpStatus.OK)
  async unregisterToken(@Req() req) {
    const userId = req.user.id;

    await this.notificationsService.unregisterFcmToken(userId);

    return {
      success: true,
      message: 'FCM token unregistered successfully',
    };
  }
}
