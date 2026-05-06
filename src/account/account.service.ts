import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AccountType } from '@prisma/client';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateUserAccount(
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    let account = await db.account.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await db.account.create({
        data: {
          userId,
          type: AccountType.USER,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    return account;
  }
}