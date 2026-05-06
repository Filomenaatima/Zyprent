import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatementService {
  constructor(private readonly prisma: PrismaService) {}

  async residentStatement(
    residentId: string,
    from?: Date,
    to?: Date,
  ) {
    const invoices = await this.prisma.rentInvoice.findMany({
      where: {
        residentId,
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalBilled = 0;
    let totalPaid = 0;

    const rows = invoices.map((inv) => {
      const total = Number(inv.totalAmount);
      const paid = Number(inv.paidAmount);

      totalBilled += total;
      totalPaid += paid;

      return {
        invoiceId: inv.id,
        period: inv.period,
        totalAmount: total,
        paidAmount: paid,
        balance: total - paid,
        status: inv.status,
        dueDate: inv.dueDate,
      };
    });

    return {
      residentId,
      totalBilled,
      totalPaid,
      outstanding: totalBilled - totalPaid,
      rows,
    };
  }
}