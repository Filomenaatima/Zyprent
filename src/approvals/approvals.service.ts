import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExpenseStatus,
  KycStatus,
  ProviderVerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewApprovalDto } from './dto/review-approval.dto';

type QueueFilters = {
  type?: string;
  status?: string;
  search?: string;
};

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      pendingKyc,
      pendingProviders,
      submittedExpenses,
      pendingProfitRequests,
      approvedTodayExpenses,
    ] = await Promise.all([
      this.prisma.kycVerification.count({
        where: { status: KycStatus.PENDING },
      }),
      this.prisma.serviceProvider.count({
        where: { verificationStatus: ProviderVerificationStatus.PENDING },
      }),
      this.prisma.expense.count({
        where: { status: ExpenseStatus.SUBMITTED },
      }),
      this.prisma.profitRequest.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.expense.count({
        where: {
          status: ExpenseStatus.APPROVED,
          reviewedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalPending:
        pendingKyc +
        pendingProviders +
        submittedExpenses +
        pendingProfitRequests,
      pendingKyc,
      pendingProviders,
      submittedExpenses,
      pendingProfitRequests,
      approvedTodayExpenses,
    };
  }

  async getQueue(filters: QueueFilters) {
    const search = (filters.search || '').trim().toLowerCase();

    const [kyc, providers, expenses, profitRequests] = await Promise.all([
      this.prisma.kycVerification.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.serviceProvider.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.expense.findMany({
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
          unit: {
            select: {
              id: true,
              number: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.profitRequest.findMany({
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let queue = [
      ...kyc.map((item) => ({
        id: item.id,
        type: 'KYC',
        status: item.status,
        title: item.fullName,
        subtitle: item.user?.email || item.user?.phone || 'No contact',
        meta: `${item.idType} • ${item.nationality}`,
        updatedAt: item.updatedAt,
        raw: item,
      })),
      ...providers.map((item) => ({
        id: item.id,
        type: 'PROVIDER',
        status: item.verificationStatus,
        title: item.companyName || item.user?.name || 'Provider',
        subtitle: item.user?.email || item.user?.phone || 'No contact',
        meta: `${item.type}${item.city ? ` • ${item.city}` : ''}`,
        updatedAt: item.updatedAt,
        raw: item,
      })),
      ...expenses.map((item) => ({
        id: item.id,
        type: 'EXPENSE',
        status: item.status,
        title: item.title,
        subtitle: item.property?.title || 'No property',
        meta: `${item.category} • ${item.currency} ${Number(item.amount).toLocaleString()}`,
        updatedAt: item.updatedAt,
        raw: item,
      })),
      ...profitRequests.map((item) => ({
        id: item.id,
        type: 'PROFIT_REQUEST',
        status: item.status,
        title: item.property?.title || 'Profit Request',
        subtitle: item.creator?.name || item.creator?.email || 'Unknown creator',
        meta: `UGX ${Number(item.amount).toLocaleString()}`,
        updatedAt: item.createdAt,
        raw: item,
      })),
    ];

    if (filters.type && filters.type !== 'ALL') {
      queue = queue.filter((item) => item.type === filters.type);
    }

    if (filters.status && filters.status !== 'ALL') {
      queue = queue.filter(
        (item) => String(item.status).toUpperCase() === filters.status?.toUpperCase(),
      );
    }

    if (search) {
      queue = queue.filter((item) =>
        [item.title, item.subtitle, item.meta]
          .join(' ')
          .toLowerCase()
          .includes(search),
      );
    }

    queue.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    return queue;
  }

  async getOne(type: string, id: string) {
    if (type === 'KYC') {
      const item = await this.prisma.kycVerification.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!item) throw new NotFoundException('KYC record not found');
      return item;
    }

    if (type === 'PROVIDER') {
      const item = await this.prisma.serviceProvider.findUnique({
        where: { id },
        include: {
          user: true,
          manager: true,
        },
      });

      if (!item) throw new NotFoundException('Provider not found');
      return item;
    }

    if (type === 'EXPENSE') {
      const item = await this.prisma.expense.findUnique({
        where: { id },
        include: {
          property: true,
          unit: true,
          createdBy: true,
          reviewedBy: true,
          maintenanceRequest: true,
        },
      });

      if (!item) throw new NotFoundException('Expense not found');
      return item;
    }

    if (type === 'PROFIT_REQUEST') {
      const item = await this.prisma.profitRequest.findUnique({
        where: { id },
        include: {
          property: true,
          creator: true,
          votes: {
            include: {
              investor: true,
            },
          },
        },
      });

      if (!item) throw new NotFoundException('Profit request not found');
      return item;
    }

    throw new BadRequestException('Unsupported approval type');
  }

  async reviewKyc(id: string, adminId: string, dto: ReviewApprovalDto) {
    const status =
      dto.action === 'APPROVE' ? KycStatus.APPROVED : KycStatus.REJECTED;

    return this.prisma.kycVerification.update({
      where: { id },
      data: {
        status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: {
        user: true,
      },
    });
  }

  async reviewProvider(id: string, dto: ReviewApprovalDto) {
    const verificationStatus =
      dto.action === 'APPROVE'
        ? ProviderVerificationStatus.VERIFIED
        : ProviderVerificationStatus.REJECTED;

    const isActive = dto.action === 'APPROVE';

    return this.prisma.serviceProvider.update({
      where: { id },
      data: {
        verificationStatus,
        ...(dto.action === 'REJECT' ? { isActive: false } : { isActive }),
      },
      include: {
        user: true,
      },
    });
  }

  async reviewExpense(id: string, adminId: string, dto: ReviewApprovalDto) {
    const status =
      dto.action === 'APPROVE'
        ? ExpenseStatus.APPROVED
        : ExpenseStatus.REJECTED;

    return this.prisma.expense.update({
      where: { id },
      data: {
        status,
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: dto.action === 'REJECT' ? dto.reason || null : null,
      },
      include: {
        property: true,
        createdBy: true,
        reviewedBy: true,
      },
    });
  }

  async reviewProfitRequest(id: string, adminId: string, dto: ReviewApprovalDto) {
    const status = dto.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const existing = await this.prisma.profitRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Profit request not found');
    }

    return this.prisma.profitRequest.update({
      where: { id },
      data: {
        status,
        processedAt: new Date(),
      },
      include: {
        property: true,
        creator: true,
        votes: true,
      },
    });
  }
}