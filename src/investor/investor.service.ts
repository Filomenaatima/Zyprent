import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, Prisma } from '@prisma/client';

@Injectable()
export class InvestorService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'INVESTOR') {
      throw new ForbiddenException('Not an investor');
    }

    /**
     * ✅ FIX: find account using type
     */
    let account = await this.prisma.account.findFirst({
      where: {
        userId,
        type: AccountType.USER,
      },
    });

    /**
     * ✅ FIX: create with correct type + balance
     */
    if (!account) {
      account = await this.prisma.account.create({
        data: {
          userId,
          type: AccountType.USER, // ✅ CORRECT
          balance: new Prisma.Decimal(0),
        },
      });
    }

    const investments = await this.prisma.investment.findMany({
      where: { investorId: userId },
      include: { property: true },
    });

    const totalInvested = investments.reduce(
      (sum, inv) => sum + Number(inv.amount),
      0,
    );

    return {
      investorId: userId,
      accountId: account.id,
      totalInvested,
      properties: investments.map((i) => i.property),
    };
  }
}