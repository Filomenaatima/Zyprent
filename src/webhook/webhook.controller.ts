import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  NotImplementedException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  private getRequiredEnv(name: string) {
    const value = process.env[name];

    if (!value?.trim()) {
      throw new BadRequestException(`${name} is not configured`);
    }

    return value.trim();
  }

  private verifyFlutterwaveWebhook(verifHash?: string) {
    const expectedHash = this.getRequiredEnv(
      'FLUTTERWAVE_WEBHOOK_SECRET_HASH',
    );

    if (!verifHash || verifHash !== expectedHash) {
      throw new UnauthorizedException('Invalid Flutterwave webhook signature');
    }
  }

  private verifyMtnWebhook(webhookToken?: string) {
    const expectedToken = this.getRequiredEnv('MTN_MOMO_WEBHOOK_TOKEN');

    if (!webhookToken || webhookToken !== expectedToken) {
      throw new UnauthorizedException('Invalid MTN MoMo webhook token');
    }
  }

  @Post('flutterwave')
  async handleFlutterwave(
    @Headers('verif-hash') verifHash: string | undefined,
    @Body() payload: any,
  ) {
    this.verifyFlutterwaveWebhook(verifHash);

    return this.paymentService.handleFlutterwaveWebhook(payload);
  }

  @Post('mtn')
  async handleMtnMomo(
    @Headers('x-mtn-webhook-token') webhookToken: string | undefined,
    @Body() payload: any,
  ) {
    this.verifyMtnWebhook(webhookToken);

    /**
     * We authenticate the webhook here, but we do NOT complete
     * the payment yet until PaymentService has MTN server-side
     * transaction verification added.
     */
    throw new NotImplementedException(
      'MTN webhook authenticated. MTN payment verification is not connected yet.',
    );
  }

  @Post('stripe')
  async handleStripe(@Body() payload: any) {
    /**
     * Keeping this route so existing code does not break.
     * Do not use this in production until raw-body Stripe
     * signature verification is added in main.ts/webhook module.
     */
    return this.paymentService.handleStripeWebhook(payload);
  }

  @Post('onafriq')
  async handleOnafriq(@Body() payload: any) {
    /**
     * Keeping this route so existing code does not break.
     * Do not use this in production until Onafriq signature
     * verification is added.
     */
    return this.paymentService.handleOnafriqWebhook(payload);
  }
}