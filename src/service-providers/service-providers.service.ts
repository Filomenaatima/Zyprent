import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  Role,
  ServiceProviderType,
  ProviderVerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';

type GetProvidersOptions = {
  requesterRole: Role;
  includeInactive?: boolean;
  verificationStatus?: string;
  type?: string;
  city?: string;
  search?: string;
};

@Injectable()
export class ServiceProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  private buildProvidersWhere(
    options: GetProvidersOptions,
  ): Prisma.ServiceProviderWhereInput {
    const where: Prisma.ServiceProviderWhereInput = {};

    if (options.requesterRole !== Role.ADMIN || !options.includeInactive) {
      where.isActive = true;
    }

    if (
      options.verificationStatus &&
      Object.values(ProviderVerificationStatus).includes(
        options.verificationStatus as ProviderVerificationStatus,
      )
    ) {
      where.verificationStatus =
        options.verificationStatus as ProviderVerificationStatus;
    }

    if (
      options.type &&
      Object.values(ServiceProviderType).includes(
        options.type as ServiceProviderType,
      )
    ) {
      where.type = options.type as ServiceProviderType;
    }

    if (options.city?.trim()) {
      where.city = {
        contains: options.city.trim(),
        mode: 'insensitive',
      };
    }

    if (options.search?.trim()) {
      const term = options.search.trim();

      where.OR = [
        {
          companyName: {
            contains: term,
            mode: 'insensitive',
          },
        },
        {
          city: {
            contains: term,
            mode: 'insensitive',
          },
        },
        {
          licenseNumber: {
            contains: term,
            mode: 'insensitive',
          },
        },
        {
          user: {
            name: {
              contains: term,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: term,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            phone: {
              contains: term,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    return where;
  }

  async createProvider(data: CreateProviderDto) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (user && user.role === Role.RESIDENT) {
      throw new BadRequestException(
        'This phone is already registered as a resident and cannot be a service provider',
      );
    }

    if (user && user.role !== Role.SERVICE_PROVIDER) {
      throw new BadRequestException(
        'This user already exists under another account type',
      );
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          password: 'TEMP_PASSWORD',
          role: Role.SERVICE_PROVIDER,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
        },
      });
    }

    const existingProvider = await this.prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (existingProvider) {
      throw new BadRequestException('User already a provider');
    }

    return this.prisma.serviceProvider.create({
      data: {
        userId: user.id,
        type: data.type,
        isActive: data.isActive ?? true,
        companyName: data.companyName,
        licenseNumber: data.licenseNumber,
        city: data.city,
      },
      include: {
        user: true,
      },
    });
  }

  async getProviders(options: GetProvidersOptions) {
    const where = this.buildProvidersWhere(options);

    const providers = await this.prisma.serviceProvider.findMany({
      where,
      include: {
        user: true,
        _count: {
          select: {
            reviews: true,
            assignments: true,
            dispatches: true,
            quotes: true,
            payouts: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { verificationStatus: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return providers.map((provider) => ({
      ...provider,
      reviewCount: provider._count.reviews,
      assignmentCount: provider._count.assignments,
      dispatchCount: provider._count.dispatches,
      quoteCount: provider._count.quotes,
      payoutCount: provider._count.payouts,
    }));
  }

  async getProvidersSummary() {
    const [
      totalProviders,
      activeProviders,
      verifiedProviders,
      pendingVerificationProviders,
      inactiveProviders,
      providers,
    ] = await Promise.all([
      this.prisma.serviceProvider.count(),
      this.prisma.serviceProvider.count({
        where: { isActive: true },
      }),
      this.prisma.serviceProvider.count({
        where: {
          verificationStatus: ProviderVerificationStatus.VERIFIED,
        },
      }),
      this.prisma.serviceProvider.count({
        where: {
          verificationStatus: ProviderVerificationStatus.PENDING,
        },
      }),
      this.prisma.serviceProvider.count({
        where: { isActive: false },
      }),
      this.prisma.serviceProvider.findMany({
        include: {
          _count: {
            select: {
              reviews: true,
              assignments: true,
              quotes: true,
              payouts: true,
            },
          },
        },
      }),
    ]);

    const avgRating =
      providers.length > 0
        ? providers.reduce(
            (sum, provider) => sum + Number(provider.rating || 0),
            0,
          ) / providers.length
        : 0;

    const totalReviews = providers.reduce(
      (sum, provider) => sum + provider._count.reviews,
      0,
    );

    const totalAssignments = providers.reduce(
      (sum, provider) => sum + provider._count.assignments,
      0,
    );

    const totalQuotes = providers.reduce(
      (sum, provider) => sum + provider._count.quotes,
      0,
    );

    const totalPayouts = providers.reduce(
      (sum, provider) => sum + provider._count.payouts,
      0,
    );

    const providersByType = providers.reduce<Record<string, number>>(
      (acc, provider) => {
        const key = provider.type;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      totalProviders,
      activeProviders,
      verifiedProviders,
      pendingVerificationProviders,
      inactiveProviders,
      avgRating,
      totalReviews,
      totalAssignments,
      totalQuotes,
      totalPayouts,
      providersByType,
    };
  }

  async getProviderByUserId(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
      include: {
        user: true,
        reviews: {
          include: {
            resident: {
              include: {
                user: true,
              },
            },
            request: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        assignments: {
          include: {
            property: true,
            unit: true,
            resident: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        dispatches: {
          include: {
            request: {
              include: {
                property: true,
                unit: true,
              },
            },
          },
          orderBy: {
            sentAt: 'desc',
          },
        },
        quotes: {
          include: {
            request: {
              include: {
                property: true,
                unit: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        payouts: {
          include: {
            request: {
              include: {
                property: true,
                unit: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  async getProvider(id: string, requesterRole: Role, requesterUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
      include: {
        user: true,
        reviews: {
          include: {
            resident: {
              include: {
                user: true,
              },
            },
            request: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        assignments: {
          include: {
            property: true,
            unit: true,
            resident: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        dispatches: {
          include: {
            request: {
              include: {
                property: true,
                unit: true,
              },
            },
          },
          orderBy: {
            sentAt: 'desc',
          },
        },
        quotes: {
          include: {
            request: {
              include: {
                property: true,
                unit: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        payouts: {
          include: {
            request: {
              include: {
                property: true,
                unit: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (
      requesterRole === Role.SERVICE_PROVIDER &&
      provider.userId !== requesterUserId
    ) {
      throw new ForbiddenException('You can only view your own provider profile');
    }

    const avgReview =
      provider.reviews.length > 0
        ? provider.reviews.reduce(
            (sum: number, review: any) => sum + Number(review.rating || 0),
            0,
          ) / provider.reviews.length
        : 0;

    const completedAssignments = provider.assignments.filter(
      (assignment: any) => assignment.status === 'COMPLETED',
    ).length;

    const acceptedQuotes = provider.quotes.filter(
      (quote: any) => quote.status === 'ACCEPTED',
    ).length;

    const completedPayouts = provider.payouts.filter(
      (payout: any) => payout.status === 'COMPLETED',
    ).length;

    const totalProviderEarnings = provider.payouts.reduce(
      (sum: number, payout: any) =>
        sum + Number(payout.providerEarning || 0),
      0,
    );

    return {
      ...provider,
      stats: {
        avgReview,
        reviewCount: provider.reviews.length,
        assignmentCount: provider.assignments.length,
        completedAssignments,
        dispatchCount: provider.dispatches.length,
        quoteCount: provider.quotes.length,
        acceptedQuotes,
        payoutCount: provider.payouts.length,
        completedPayouts,
        totalProviderEarnings,
      },
    };
  }

  async verifyProvider(id: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return this.prisma.serviceProvider.update({
      where: { id },
      data: {
        verificationStatus: ProviderVerificationStatus.VERIFIED,
      },
      include: {
        user: true,
      },
    });
  }

  async deactivateProvider(id: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return this.prisma.serviceProvider.update({
      where: { id },
      data: { isActive: false },
      include: {
        user: true,
      },
    });
  }

  async reactivateProvider(id: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return this.prisma.serviceProvider.update({
      where: { id },
      data: { isActive: true },
      include: {
        user: true,
      },
    });
  }
}