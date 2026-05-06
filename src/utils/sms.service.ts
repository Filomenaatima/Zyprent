import { Injectable, Logger } from '@nestjs/common';

// Placeholder SMS service. Replace with Twilio / AfricaTalking implementation later.
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendPasswordBySms(phone: string, password: string): Promise<void> {
    // For now just log; replace with real SMS provider integration.
    this.logger.log(`(SMS) To: ${phone} - Your account password: ${password}`);
    // Example: call Twilio / AfricaTalking here and throw on failure.
    return;
  }

  async sendPasswordByEmail(email: string, password: string): Promise<void> {
    // Placeholder for email approach (optional)
    this.logger.log(`(Email) To: ${email} - Your account password: ${password}`);
    return;
  }
}
