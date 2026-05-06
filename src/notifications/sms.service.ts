import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class SmsService {

  private client: any;
  private enabled = false;

  private logger = new Logger(SmsService.name);

  constructor() {

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    // Only enable SMS if credentials are valid
    if (sid && sid.startsWith('AC') && token) {

      this.client = twilio(sid, token);
      this.enabled = true;

      this.logger.log('Twilio SMS enabled');

    } else {

      this.logger.warn('Twilio SMS disabled (missing credentials)');

    }

  }

  async sendSMS(to: string, message: string) {

    if (!this.enabled) return;

    if (!to) return;

    await this.client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE!,
      to,
    });

  }

}