import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FraudService {

  private logger = new Logger(FraudService.name);

  constructor(private prisma: PrismaService) {}

  /*
  MANUAL CHECK - Maintenance Quote Fraud
  */

  async detectMaintenanceQuoteFraud(requestId: string) {

    const quotes = await this.prisma.maintenanceQuote.findMany({
      where: { requestId },
    });

    if (quotes.length === 0) {
      return { message: 'No quotes found' };
    }

    const avg =
      quotes.reduce((sum, q) => sum + q.totalAmount, 0) / quotes.length;

    const suspicious = quotes.filter(
      q => q.totalAmount > avg * 3,
    );

    return {
      averageQuote: avg,
      suspiciousQuotes: suspicious,
    };
  }

  /*
  MANUAL CHECK - Investor Fraud
  */

  async detectInvestorFraud(investorId: string) {

    const tx = await this.prisma.shareTransaction.findMany({
      where: { investorId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (tx.length > 20) {
      return {
        warning: 'High trading frequency detected',
        transactions: tx.length,
      };
    }

    return {
      message: 'No suspicious investor activity',
    };
  }

  /*
  AUTOMATIC SCAN - Maintenance Fraud
  */

  async scanMaintenanceQuotes() {

    const quotes = await this.prisma.maintenanceQuote.findMany();

    for (const quote of quotes) {

      const avg = await this.prisma.maintenanceQuote.aggregate({
        where: { requestId: quote.requestId },
        _avg: { totalAmount: true },
      });

      const avgAmount = avg._avg.totalAmount || 0;

      if (avgAmount > 0 && quote.totalAmount > avgAmount * 3) {

        this.logger.warn(`
        Fraud Alert: Maintenance Quote
        Provider: ${quote.providerId}
        Quote: ${quote.totalAmount}
        Average: ${avgAmount}
        `);

      }
    }
  }

  /*
  AUTOMATIC SCAN - Withdrawal Fraud
  */

  async scanWithdrawals() {

    const withdrawals = await this.prisma.withdrawalRequest.findMany({
      where: {
        amount: {
          gt: 100000,
        },
      },
    });

    withdrawals.forEach(w => {

      this.logger.warn(`
      Fraud Alert: Large Withdrawal
      Investor: ${w.investorId}
      Amount: ${w.amount}
      `);

    });
  }

  /*
  AUTOMATIC SCAN - Share Trading Fraud
  */

  async scanShareTransactions() {

    const tx = await this.prisma.shareTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const grouped: Record<string, number> = {};

    for (const t of tx) {

      if (!grouped[t.investorId]) {
        grouped[t.investorId] = 0;
      }

      grouped[t.investorId] += 1;
    }

    for (const investor in grouped) {

      if (grouped[investor] > 20) {

        this.logger.warn(`
        Fraud Alert: High trading frequency
        Investor: ${investor}
        Transactions: ${grouped[investor]}
        `);

      }
    }
  }
}