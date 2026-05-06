import { Injectable, NotFoundException } from '@nestjs/common';
import {
  InvoiceStatus,
  RentCycle,
  UnitStatus,
  LedgerSource,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ValuationService {
  constructor(private prisma: PrismaService) {}

  private annualizeRent(amount: number, cycle: RentCycle) {
    return cycle === RentCycle.YEARLY ? amount : amount * 12;
  }

  private round(value: number) {
    return Number((value || 0).toFixed(2));
  }

  async calculatePropertyValue(propertyId: string) {
    const trailingStart = new Date();
    trailingStart.setMonth(trailingStart.getMonth() - 12);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        units: true,
        investmentOffer: true,
        shares: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // ✅ REAL INCOME (payments)
    const invoices = await this.prisma.rentInvoice.findMany({
      where: {
        unit: { propertyId },
        dueDate: { gte: trailingStart },
        status: {
          in: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
        },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    const grossPotentialAnnualRent = property.units.reduce(
      (sum, unit) =>
        sum +
        this.annualizeRent(Number(unit.rentAmount || 0), unit.rentCycle),
      0,
    );

    const occupiedAnnualRent = property.units
      .filter((u) => u.status === UnitStatus.OCCUPIED)
      .reduce(
        (sum, unit) =>
          sum +
          this.annualizeRent(Number(unit.rentAmount || 0), unit.rentCycle),
        0,
      );

    const vacancyAllowance = Math.max(
      grossPotentialAnnualRent - occupiedAnnualRent,
      0,
    );

    const occupancyRate =
      grossPotentialAnnualRent > 0
        ? occupiedAnnualRent / grossPotentialAnnualRent
        : 0;

    // ✅ REAL EXPENSES (ledger-based)
    const ledgerExpenses = await this.prisma.ledgerEntry.aggregate({
      where: {
        propertyId,
        source: LedgerSource.EXPENSE_PAYMENT,
        createdAt: {
          gte: trailingStart,
        },
      },
      _sum: {
        debit: true,
      },
    });

    const trailingExpenses = Number(ledgerExpenses._sum.debit ?? 0);

    const billedTrailing12Months = invoices.reduce(
      (sum, i) => sum + Number(i.totalAmount || 0),
      0,
    );

    const collectedTrailing12Months = invoices.reduce(
      (sum, i) => sum + Number(i.paidAmount || 0),
      0,
    );

    // ✅ NOI now correct
    const noi = collectedTrailing12Months - trailingExpenses;

    const capRate =
      property.valuationCapRate && property.valuationCapRate > 0
        ? Number(property.valuationCapRate)
        : 0.1;

    const computedMarketValue =
      noi > 0 && capRate > 0 ? noi / capRate : 0;

    const approvedMarketValue =
      property.marketValue && property.marketValue > 0
        ? Number(property.marketValue)
        : null;

    const effectiveMarketValue =
      approvedMarketValue !== null
        ? approvedMarketValue
        : computedMarketValue;

    const issuedShares = property.shares.reduce(
      (sum, s) => sum + Number(s.sharesOwned || 0),
      0,
    );

    const valuationUnits =
      property.investmentOffer?.totalShares && property.investmentOffer.totalShares > 0
        ? Number(property.investmentOffer.totalShares)
        : issuedShares;

    const entrySharePrice =
      property.investmentOffer?.pricePerShare || 0;

    const currentSharePrice =
      valuationUnits > 0
        ? effectiveMarketValue / valuationUnits
        : 0;

    const priceMovementPercent =
      entrySharePrice > 0
        ? ((currentSharePrice - entrySharePrice) / entrySharePrice) * 100
        : 0;

    return {
      propertyId: property.id,
      propertyTitle: property.title,
      location: property.location,

      grossPotentialAnnualRent: this.round(grossPotentialAnnualRent),
      occupiedAnnualRent: this.round(occupiedAnnualRent),
      vacancyAllowance: this.round(vacancyAllowance),
      occupancyRate: this.round(occupancyRate * 100),

      trailingExpenses: this.round(trailingExpenses),
      billedTrailing12Months: this.round(billedTrailing12Months),
      collectedTrailing12Months: this.round(collectedTrailing12Months),

      noi: this.round(noi),
      capRate: this.round(capRate * 100),

      approvedMarketValue:
        approvedMarketValue !== null
          ? this.round(approvedMarketValue)
          : null,

      computedMarketValue: this.round(computedMarketValue),
      effectiveMarketValue: this.round(effectiveMarketValue),

      valuationUnits,
      entrySharePrice: this.round(entrySharePrice),
      currentSharePrice: this.round(currentSharePrice),
      priceMovementPercent: this.round(priceMovementPercent),

      valuationMode:
        approvedMarketValue !== null
          ? 'ADMIN_APPROVED'
          : 'COMPUTED',
    };
  }
}