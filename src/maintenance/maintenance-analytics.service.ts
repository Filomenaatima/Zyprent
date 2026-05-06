import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MaintenanceStatus,
  QuoteStatus,
} from '@prisma/client';

@Injectable()
export class MaintenanceAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /* ========================================
     MAINTENANCE ANALYTICS
  ======================================== */
  async getMaintenanceAnalytics(propertyId: string) {
    const totalRequests = await this.prisma.maintenanceRequest.count({
      where: { propertyId },
    });

    const requestsByStatus = await this.prisma.maintenanceRequest.groupBy({
      by: ['status'],
      where: { propertyId },
      _count: { status: true },
    });

    const statusCounts: Record<MaintenanceStatus, number> = requestsByStatus.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      },
      {} as Record<MaintenanceStatus, number>,
    );

    const completedRequests = await this.prisma.maintenanceRequest.findMany({
      where: { propertyId, status: MaintenanceStatus.COMPLETED },
      select: { createdAt: true, updatedAt: true },
    });

    const avgCompletionHours =
      completedRequests.length > 0
        ? completedRequests
            .map((r) => (r.updatedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60))
            .reduce((a, b) => a + b, 0) / completedRequests.length
        : 0;

    const quoteStats = await this.prisma.maintenanceQuote.groupBy({
      by: ['status'],
      where: { request: { propertyId } },
      _count: { status: true },
    });

    const quotesCount: Record<QuoteStatus, number> = quoteStats.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      },
      {} as Record<QuoteStatus, number>,
    );

    const providerRatings = await this.prisma.serviceProviderReview.groupBy({
      by: ['providerId'],
      where: { request: { propertyId } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const providersPerformance = providerRatings.map((r) => ({
      providerId: r.providerId,
      avgRating: r._avg?.rating ?? 0,
      totalReviews: r._count?.rating ?? 0,
    }));

    return {
      totalRequests,
      statusCounts,
      avgCompletionHours,
      quotesCount,
      providersPerformance,
    };
  }

  /* ========================================
     PREDICTIVE MAINTENANCE
  ======================================== */
  async predictMaintenance(propertyId: string) {
    const requests = await this.prisma.maintenanceRequest.findMany({
      where: { propertyId },
    });

    const categoryCount: Record<string, number> = {};

    for (const r of requests) {
      if (!r.category) continue;
      categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
    }

    const predictions = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return predictions.map(([category, count]) => ({
      category,
      likelihood: count,
    }));
  }
}