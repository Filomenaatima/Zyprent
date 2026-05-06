import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private safeUserSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async getProviderReviews(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
      include: {
        user: {
          select: this.safeUserSelect,
        },
      },
    });

    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    const reviews = await this.prisma.serviceProviderReview.findMany({
      where: {
        providerId: provider.id,
      },
      include: {
        resident: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
        request: {
          include: {
            property: true,
            unit: true,
          },
        },
        provider: {
          include: {
            user: {
              select: this.safeUserSelect,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
          totalReviews
        : 0;

    const fiveStar = reviews.filter((r) => Number(r.rating) === 5).length;
    const fourStar = reviews.filter((r) => Number(r.rating) === 4).length;
    const threeStar = reviews.filter((r) => Number(r.rating) === 3).length;
    const twoStar = reviews.filter((r) => Number(r.rating) === 2).length;
    const oneStar = reviews.filter((r) => Number(r.rating) === 1).length;

    const responseRateBase = await this.prisma.maintenanceDispatch.count({
      where: {
        providerId: provider.id,
      },
    });

    const respondedCount = await this.prisma.maintenanceDispatch.count({
      where: {
        providerId: provider.id,
        respondedAt: {
          not: null,
        },
      },
    });

    const responseRate =
      responseRateBase > 0
        ? Math.round((respondedCount / responseRateBase) * 100)
        : 0;

    return {
      provider: {
        id: provider.id,
        companyName: provider.companyName,
        type: provider.type,
        city: provider.city,
        verificationStatus: provider.verificationStatus,
        rating: provider.rating,
        reviewCount: provider.reviewCount,
      },
      summary: {
        totalReviews,
        averageRating: Number(averageRating.toFixed(1)),
        fiveStar,
        fourStar,
        threeStar,
        twoStar,
        oneStar,
        responseRate,
      },
      reviews,
    };
  }
}