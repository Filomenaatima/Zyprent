import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerSource } from '@prisma/client';

@Injectable()
export class MoveOutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * =====================================================
   * HANDLE MOVE-OUT RECONCILIATION
   * =====================================================
   */
  async reconcileMoveOut(params: {
    residentId: string;
    damageAmount: number;
  }) {
    if (params.damageAmount <= 0) {
      return { status: 'NO_CHARGES' };
    }

    const resident = await this.prisma.resident.findUnique({
      where: { id: params.residentId },
      include: {
        user: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!resident || !resident.user?.account) {
      throw new BadRequestException('Resident account not found');
    }

    /**
     * 🔥 DEBIT RESIDENT (PLATFORM FEE / DAMAGE CHARGE)
     */
    await this.ledger.debitAccount({
      accountId: resident.user.account.id,
      amount: params.damageAmount,
      source: LedgerSource.PLATFORM_FEE,
      reference: `MOVE_OUT_DAMAGE_${Date.now()}`,
    });

    return {
      status: 'CHARGED',
      amount: params.damageAmount,
    };
  }
}