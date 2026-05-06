import { Controller, Get, Param, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('profit-loss')
  async profitLoss(@Query('propertyId') propertyId?: string) {
    return this.finance.profitAndLoss(propertyId);
  }

  @Get('cash-flow')
  async cashFlow(@Query('propertyId') propertyId?: string) {
    return this.finance.cashFlow(propertyId);
  }

  @Get('property-performance/:id')
  async propertyPerformance(@Param('id') id: string) {
    return this.finance.propertyPerformance(id);
  }
}