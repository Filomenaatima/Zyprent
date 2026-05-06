import { Controller, Get, Param } from '@nestjs/common';
import { FraudService } from './fraud.service';

@Controller('fraud')
export class FraudController {

  constructor(private fraud: FraudService) {}

  @Get('maintenance/:requestId')
  async checkMaintenance(@Param('requestId') id: string) {
    return this.fraud.detectMaintenanceQuoteFraud(id);
  }

  @Get('investor/:investorId')
  async checkInvestor(@Param('investorId') id: string) {
    return this.fraud.detectInvestorFraud(id);
  }

}