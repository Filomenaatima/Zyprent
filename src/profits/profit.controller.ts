import { Controller, Get, Param } from '@nestjs/common';
import { ProfitService } from './profit.service';

@Controller('profits')
export class ProfitController {
  constructor(private profitService: ProfitService) {}

  @Get('property/:propertyId')
  getPropertyProfit(@Param('propertyId') propertyId: string) {
    return this.profitService.getAvailableProfit(propertyId);
  }

  @Get('investor/:investorId')
  getInvestorProfit(@Param('investorId') investorId: string) {
    return this.profitService.getInvestorProfit(investorId);
  }
}