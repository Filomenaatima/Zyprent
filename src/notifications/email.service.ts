import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private enabled = false;

  constructor() {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !port || !user || !pass) {
      this.logger.warn('Email disabled: missing email environment variables');
      this.enabled = false;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: {
        user,
        pass,
      },
    });

    this.enabled = true;
  }

  async sendEmail(to: string, subject: string, message: string) {
    if (!this.enabled || !this.transporter) {
      this.logger.warn(`Email skipped for ${to}: email service disabled`);
      return {
        skipped: true,
        reason: 'EMAIL_DISABLED',
      };
    }

    try {
      await this.transporter.sendMail({
        from: `"Zyrent" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: `<p>${message}</p>`,
      });

      return {
        skipped: false,
        sent: true,
      };
    } catch (error: any) {
      this.logger.error(
        `Email send failed for ${to}: ${error?.message || error}`,
      );
      throw error;
    }
  }
}