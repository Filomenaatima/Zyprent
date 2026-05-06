import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async propertyAnalytics(propertyId: string) {

    const offer = await this.prisma.investmentOffer.findUnique({
      where: { propertyId },
      include: {
        property: true,
        investorShares: true
      }
    });

    if (!offer) {
      throw new NotFoundException('Investment offer not found');
    }

    // total rent collected
    const rent = await this.prisma.rentInvoice.aggregate({
      _sum: {
        paidAmount: true
      },
      where: {
        unit: {
          propertyId
        }
      }
    });

    const totalRentCollected = Number(rent._sum.paidAmount || 0);

    // assume rent collected represents monthly performance
    const monthlyRent = totalRentCollected;

    // estimated expenses (20%)
    const monthlyExpenses = monthlyRent * 0.2;

    const monthlyProfit = monthlyRent - monthlyExpenses;

    const annualProfit = monthlyProfit * 12;

    const totalShares = offer.totalShares;
    const sharesSold = offer.sharesSold;

    const investors = offer.investorShares.length;

    const propertyValue =
      totalShares * offer.pricePerShare;

    const profitPerShare =
      totalShares === 0 ? 0 : monthlyProfit / totalShares;

    // occupancy calculation
    const totalUnits = await this.prisma.unit.count({
      where: { propertyId }
    });

    const occupiedUnits = await this.prisma.unit.count({
      where: {
        propertyId,
        status: 'OCCUPIED'
      }
    });

    const occupancyRate =
      totalUnits === 0 ? 0 : occupiedUnits / totalUnits;

    // investor demand
    const demandRate =
      totalShares === 0 ? 0 : sharesSold / totalShares;

    // annual yield
    const annualYield =
      propertyValue === 0 ? 0 : annualProfit / propertyValue;

    // share price growth factors
    const yieldFactor = annualYield;
    const occupancyFactor = occupancyRate * 0.2;
    const demandFactor = demandRate * 0.3;

    // automatic share price growth
    const marketSharePrice =
      offer.pricePerShare *
      (1 + yieldFactor + occupancyFactor + demandFactor);

    return {

      property: offer.property.title,
      location: offer.property.location,

      totalShares,
      sharesSold,
      investors,

      propertyValue,

      totalUnits,
      occupiedUnits,
      occupancyRate: (occupancyRate * 100).toFixed(2) + '%',

      monthlyRent,
      monthlyExpenses,
      monthlyProfit,
      annualProfit,

      profitPerShare,

      projectedROI: (annualYield * 100).toFixed(2) + '%',

      demandRate: (demandRate * 100).toFixed(2) + '%',

      marketSharePrice: marketSharePrice.toFixed(2)

    };
  }
}