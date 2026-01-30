import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  BatchResponse,
  Message,
  MulticastMessage,
} from 'firebase-admin/lib/messaging/messaging-api';

@Injectable()
export class FirebasePushNotificationsService {
  constructor(@Inject('FIREBASE_APP') private firebaseApp: admin.app.App) {}

  /**
   * Sends a notification message to a single device.
   *
   * @param {Message} message - The notification message to send.
   * @returns {Promise<string>} A Promise that resolves to the response from Firebase Cloud Messaging (FCM).
   */
  async sendNotification(message: Message): Promise<string> {
    try {
      const messaging = this.firebaseApp.messaging();
      const response = await messaging.send(message);
      return response;
    } catch (e) {
      return '';
    }
  }

  /**
   * Sends notification messages to multiple devices.
   *
   * @param {Message[]} messages - An array of notification messages to send.
   * @returns {Promise<BatchResponse>} A Promise that resolves when all messages have been sent.
   */
  async sendNotifications(
    messages: Message[],
  ): Promise<BatchResponse | undefined> {
    try {
      const messaging = this.firebaseApp.messaging();
      return messaging.sendEach(messages);
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Sends a multicast notification message to multiple devices.
   *
   * @param {MulticastMessage} multicastMessage - The multicast notification message to send.
   * @returns {Promise<BatchResponse>} A Promise that resolves when all messages have been sent.
   */
  async sendMulticastNotification(
    multicastMessage: MulticastMessage,
  ): Promise<BatchResponse | undefined> {
    try {
      const messaging = this.firebaseApp.messaging();
      return messaging.sendEachForMulticast(multicastMessage);
    } catch (e) {
      return undefined;
    }
  }
}
