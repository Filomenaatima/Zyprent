import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Controller('withdrawals')
export class WithdrawalsController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Post('request')
  async requestWithdrawal(@Body() body: any) {
    const { userId, amount } = body;

    if (!userId || !amount) {
      throw new BadRequestException('userId and amount are required');
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new BadRequestException('Invalid withdrawal amount');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const request = await this.prisma.withdrawalRequest.create({
      data: {
        walletId: wallet.id,
        investorId: userId, // ✅ keep (business logic)
        amount: numericAmount,
      },
    });

    await this.notificationsService.createNotification({
      userId,
      title: 'Withdrawal Request',
      message: `Your withdrawal request of ${numericAmount} has been submitted.`,
      type: NotificationType.WITHDRAWAL_REQUEST,
    });

    return request;
  }

  @Post('approve')
  async approveWithdrawal(@Body() body: any) {
    const { withdrawalId } = body;

    if (!withdrawalId) {
      throw new BadRequestException('withdrawalId is required');
    }

    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { wallet: true },
    });

    if (!withdrawal) {
      throw new BadRequestException('Withdrawal not found');
    }

    if (withdrawal.status === 'APPROVED') {
      throw new BadRequestException('Already approved');
    }

    /**
     * ✅ FIX: Decimal-safe comparison
     */
    if (
      Number(withdrawal.wallet.balance) <
      Number(withdrawal.amount)
    ) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    return this.prisma.$transaction(async (tx) => {
      // update withdrawal
      const updated = await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: 'APPROVED' },
      });

      // deduct wallet
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          balance: {
            decrement: withdrawal.amount,
          },
        },
      });

      // record wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: withdrawal.walletId,
          type: 'WITHDRAWAL',
          amount: withdrawal.amount,
          status: 'COMPLETED',
          reference: `WITHDRAWAL_${withdrawalId}`,
        },
      });

      // notify user
      await this.notificationsService.createNotification({
        userId: withdrawal.investorId, // ✅ correct mapping
        title: 'Withdrawal Approved',
        message: `Your withdrawal request has been approved.`,
        type: NotificationType.WITHDRAWAL_APPROVED,
      });

      return updated;
    });
  }
}