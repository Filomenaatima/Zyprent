import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerSource } from '@prisma/client';

@Controller('ledger')
export class LedgerController {
  constructor(
    private readonly ledger: LedgerService,
    private readonly prisma: PrismaService, // ✅ NEW
  ) {}

  @Post('credit')
  credit(
    @Req() req: Request,
    @Body()
    body: {
      amount: number;
      source?: LedgerSource;
      reference?: string;
      propertyId?: string;
      userId?: string;
    },
  ) {
    const userId = (req as any)?.user?.id ?? body.userId;

    if (!userId && !body.propertyId) {
      throw new BadRequestException(
        'Provide propertyId or authenticated user',
      );
    }

    return this.ledger.creditAccount({
      userId,
      propertyId: body.propertyId,
      amount: body.amount,
      source: body.source,
      reference: body.reference,
    });
  }

  @Post('debit')
  debit(
    @Req() req: Request,
    @Body()
    body: {
      amount: number;
      source: LedgerSource;
      reference?: string;
      propertyId?: string;
      accountId?: string;
    },
  ) {
    if (!body.propertyId && !body.accountId) {
      throw new BadRequestException(
        'Provide propertyId or accountId',
      );
    }

    if (body.propertyId) {
      return this.ledger.creditAccount({
        propertyId: body.propertyId,
        amount: -Math.abs(body.amount),
        source: body.source,
        reference: body.reference,
      });
    }

    return this.ledger.debitAccount({
      accountId: body.accountId!,
      amount: body.amount,
      source: body.source,
      reference: body.reference,
    });
  }

  @Post('transfer')
  transfer(
    @Body()
    body: {
      debitAccountId: string;
      creditAccountId: string;
      amount: number;
      source: LedgerSource;
      reference?: string;
      propertyId?: string;
    },
  ) {
    return this.ledger.recordDoubleEntry(body);
  }

  /**
   * =========================================
   * ✅ BALANCE BY ACCOUNT
   * =========================================
   */
  @Get('balance/:accountId')
  getBalance(@Param('accountId') accountId: string) {
    return this.ledger.getBalance(accountId);
  }

  /**
   * =========================================
   * ✅ NEW: BALANCE BY USER (CRITICAL FIX)
   * =========================================
   */
  @Get('balance/user/:userId')
  async getUserBalance(@Param('userId') userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { userId },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    return this.ledger.getBalance(account.id);
  }

  @Get('account/:accountId')
  getAccountLedger(@Param('accountId') accountId: string) {
    return this.ledger.getAccountLedger(accountId);
  }

  @Get('property/:propertyId')
  getPropertyLedger(@Param('propertyId') propertyId: string) {
    return this.ledger.getPropertyLedger(propertyId);
  }

  @Get('trial-balance')
  trialBalance() {
    return this.ledger.trialBalance();
  }
}