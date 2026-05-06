import { BadRequestException, Injectable } from '@nestjs/common';
import { WithdrawalMethod } from '@prisma/client';
import { randomUUID } from 'crypto';

type SendPayoutParams = {
  withdrawalId: string;
  amount: number;
  method: WithdrawalMethod;
  phoneNumber?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  cardLast4?: string | null;
};

@Injectable()
export class WithdrawalPayoutService {
  private readonly mode = process.env.PAYOUT_MODE || 'SIMULATED';
  private readonly momoBaseUrl =
    process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
  private readonly momoSubscriptionKey =
    process.env.MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY || '';
  private readonly momoApiUser = process.env.MTN_MOMO_API_USER || '';
  private readonly momoApiKey = process.env.MTN_MOMO_API_KEY || '';
  private readonly momoEnvironment =
    process.env.MTN_MOMO_ENVIRONMENT || 'sandbox';
  private readonly momoCurrency = process.env.MTN_MOMO_CURRENCY || 'UGX';

  async sendPayout(params: SendPayoutParams) {
    this.validatePayout(params);

    if (params.method !== WithdrawalMethod.MOBILE_MONEY) {
      return this.simulatePayout(params);
    }

    if (this.mode !== 'MTN_MOMO_SANDBOX') {
      return this.simulatePayout(params);
    }

    return this.sendMtnMomoSandboxPayout(params);
  }

  private validatePayout(params: SendPayoutParams) {
    if (!params.amount || params.amount <= 0) {
      throw new BadRequestException('Invalid payout amount');
    }

    if (params.method === WithdrawalMethod.MOBILE_MONEY) {
      if (!params.phoneNumber?.trim()) {
        throw new BadRequestException('Mobile money phone number is required');
      }

      return;
    }

    if (params.method === WithdrawalMethod.BANK) {
      if (
        !params.bankName?.trim() ||
        !params.accountName?.trim() ||
        !params.accountNumber?.trim()
      ) {
        throw new BadRequestException('Bank payout details are incomplete');
      }

      return;
    }

    if (params.method === WithdrawalMethod.CARD) {
      if (!params.cardLast4?.trim()) {
        throw new BadRequestException('Card payout details are incomplete');
      }

      return;
    }

    throw new BadRequestException('Unsupported withdrawal method');
  }

  private simulatePayout(params: SendPayoutParams) {
    const prefix =
      params.method === WithdrawalMethod.MOBILE_MONEY
        ? 'SIM-MOMO'
        : params.method === WithdrawalMethod.BANK
          ? 'SIM-BANK'
          : 'SIM-CARD';

    return {
      success: true,
      provider: 'SIMULATED_PAYOUT_PROVIDER',
      reference: `${prefix}-${params.withdrawalId
        .slice(0, 8)
        .toUpperCase()}-${Date.now()}`,
    };
  }

  private formatMtnMsisdn(phoneNumber: string) {
    return phoneNumber.replace(/[^\d]/g, '').replace(/^0/, '256');
  }

  private async getMtnMomoAccessToken() {
    if (!this.momoSubscriptionKey || !this.momoApiUser || !this.momoApiKey) {
      throw new BadRequestException(
        'MTN MoMo sandbox credentials are not configured',
      );
    }

    const basicAuth = Buffer.from(
      `${this.momoApiUser}:${this.momoApiKey}`,
    ).toString('base64');

    const response = await fetch(
      `${this.momoBaseUrl}/disbursement/token/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Ocp-Apim-Subscription-Key': this.momoSubscriptionKey,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestException(
        `MTN MoMo token request failed: ${errorText || response.statusText}`,
      );
    }

    const data = (await response.json()) as { access_token?: string };

    if (!data.access_token) {
      throw new BadRequestException('MTN MoMo access token was not returned');
    }

    return data.access_token;
  }

  private async sendMtnMomoSandboxPayout(params: SendPayoutParams) {
    const accessToken = await this.getMtnMomoAccessToken();
    const referenceId = randomUUID();
    const msisdn = this.formatMtnMsisdn(params.phoneNumber || '');

    const response = await fetch(
      `${this.momoBaseUrl}/disbursement/v1_0/transfer`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': this.momoEnvironment,
          'Ocp-Apim-Subscription-Key': this.momoSubscriptionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: String(params.amount),
          currency: this.momoCurrency,
          externalId: params.withdrawalId,
          payee: {
            partyIdType: 'MSISDN',
            partyId: msisdn,
          },
          payerMessage: 'Zyrent wallet withdrawal',
          payeeNote: 'Zyrent payout',
        }),
      },
    );

    if (!response.ok && response.status !== 202) {
      const errorText = await response.text();
      throw new BadRequestException(
        `MTN MoMo payout failed: ${errorText || response.statusText}`,
      );
    }

    return {
      success: true,
      provider: 'MTN_MOMO_SANDBOX',
      reference: `MTN-MOMO-${referenceId}`,
    };
  }
}