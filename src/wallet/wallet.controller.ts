import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentProvider, WithdrawalMethod } from '@prisma/client';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(JwtGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Req() req: Request) {
    const userId = (req.user as any).id;

    return {
      balance: await this.walletService.getUserBalance(userId),
    };
  }

  @Get('summary')
  async getWalletSummary(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.walletService.getWalletSummary(userId);
  }

  @Get('transactions')
  async getWalletTransactions(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req.user as any).id;

    return this.walletService.getWalletTransactions(
      userId,
      Number.isNaN(Number(page ?? 1)) ? 1 : Number(page ?? 1),
      Number.isNaN(Number(limit ?? 10)) ? 10 : Number(limit ?? 10),
    );
  }

  /**
   * =========================================
   * ✅ SAFE WALLET FUNDING INITIATION
   * =========================================
   * This does NOT credit the wallet immediately.
   * Wallet is credited only after verified provider webhook.
   */
  @Post('fund')
  async initiateWalletFunding(
    @Req() req: Request,
    @Body()
    body: {
      amount: number;
      provider?: PaymentProvider;
      providerRef?: string;
    },
  ) {
    const userId = (req.user as any).id;

    if (!body.amount || Number(body.amount) <= 0) {
      throw new BadRequestException('Valid amount is required');
    }

    const provider = body.provider ?? PaymentProvider.FLUTTERWAVE;

    if (
      provider !== PaymentProvider.FLUTTERWAVE &&
      provider !== PaymentProvider.ONAFRIQ
    ) {
      throw new BadRequestException(
        'Wallet funding provider must be FLUTTERWAVE or ONAFRIQ',
      );
    }

    return this.walletService.initiateWalletFunding({
      userId,
      amount: Number(body.amount),
      provider,
      providerRef: body.providerRef,
    });
  }

  /**
   * =========================================
   * ✅ ADMIN / INTERNAL MANUAL FUNDING ONLY
   * =========================================
   * Keep this for seed/testing/admin reconciliation.
   * Do not expose this on the normal frontend.
   */
  @Post('fund/manual')
  async fundWalletManually(
    @Req() req: Request,
    @Body() body: { amount: number; reference?: string },
  ) {
    const userId = (req.user as any).id;

    return this.walletService.fundWalletFromExternal({
      userId,
      amount: body.amount,
      reference: body.reference,
    });
  }

  @Post('withdraw')
  async requestWithdrawal(
    @Req() req: Request,
    @Body()
    body: {
      amount: number;
      method?: WithdrawalMethod;
      phoneNumber?: string;
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
      cardLast4?: string;
    },
  ) {
    const userId = (req.user as any).id;
    return this.walletService.requestWithdrawal(userId, body);
  }

  @Post('withdraw/:id/approve')
  async approveWithdrawal(@Param('id') id: string) {
    return this.walletService.approveWithdrawal(id);
  }

  @Post('withdraw/:id/process')
  async processWithdrawal(@Param('id') id: string) {
    return this.walletService.processApprovedWithdrawal(id);
  }

  @Post('withdraw/:id/complete')
  async completeWithdrawal(
    @Param('id') id: string,
    @Body() body: { payoutReference?: string },
  ) {
    return this.walletService.completeWithdrawal(id, body.payoutReference);
  }

  @Post('withdraw/:id/fail')
  async failWithdrawal(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.walletService.failWithdrawal(id, body.reason);
  }

  @Post('withdraw/:id/reject')
  async rejectWithdrawal(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.walletService.rejectWithdrawal(id, body.reason);
  }

  @Get('withdrawals')
  async getWithdrawals() {
    return this.walletService.getWithdrawalRequests();
  }

  @Get('admin/:userId')
  async getUserWalletAdmin(@Param('userId') userId: string) {
    const wallet = await this.walletService.getOrCreateWallet(userId);
    const balance = await this.walletService.getUserBalance(userId);

    return {
      ...wallet,
      balance,
    };
  }
}