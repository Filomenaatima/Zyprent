import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InvestorShareService } from './investor-share.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Request } from 'express';

@Controller('investor-shares')
export class InvestorShareController {
  constructor(private readonly service: InvestorShareService) {}

  /**
   * =========================================
   * CREATE SHARE (SECURE)
   * =========================================
   */
  @UseGuards(JwtGuard)
  @Post()
  createShare(
    @Req() req: Request,
    @Body()
    body: {
      propertyId: string;
      offerId?: string;
      sharesOwned: number;
      amountPaid: number;
    },
  ) {
    const investorId = (req.user as any).id;

    return this.service.createShare({
      ...body,
      investorId, // ✅ FIXED HERE
    });
  }

  /**
   * =========================================
   * PROPERTY INVESTORS
   * =========================================
   */
  @Get('property/:propertyId')
  getPropertyInvestors(@Param('propertyId') propertyId: string) {
    return this.service.getPropertyInvestors(propertyId);
  }

  /**
   * =========================================
   * INVESTOR PORTFOLIO
   * =========================================
   */
  @UseGuards(JwtGuard)
  @Get('me')
  getMyPortfolio(@Req() req: Request) {
    const investorId = (req.user as any).id;
    return this.service.getInvestorPortfolio(investorId);
  }
}