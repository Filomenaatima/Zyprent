import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProfitDistributionsService } from './profit-distributions.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('profit-distributions')
export class ProfitDistributionsController {
  constructor(private service: ProfitDistributionsService) {}

  /**
   * POST /profit-distributions
   * Body: { propertyId, totalProfit, periodMonth, periodYear, creditWallet? }
   */
  @Post()
  async distribute(@Body() body: any) {
    return this.service.distributeProfit(body);
  }

  /**
   * GET /profit-distributions/me
   */
  @UseGuards(JwtGuard)
  @Get('me')
  async getMine(@Req() req: Request) {
    const investorId = (req.user as any).id;
    return this.service.getInvestorEarnings(investorId);
  }

  /**
   * GET /profit-distributions/investor/:investorId
   */
  @Get('investor/:investorId')
  getInvestor(@Param('investorId') investorId: string) {
    return this.service.getInvestorEarnings(investorId);
  }

  /**
   * GET /profit-distributions/property/:propertyId
   */
  @Get('property/:propertyId')
  getProperty(@Param('propertyId') propertyId: string) {
    return this.service.getPropertyDistributions(propertyId);
  }
}