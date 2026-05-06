import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Role } from '@prisma/client';
import { InvestmentService } from './investment.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: Role;
    email?: string;
  };
};

@Controller('investments')
@UseGuards(JwtGuard)
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  @Get('my')
  getMyInvestments(@Req() req: AuthenticatedRequest) {
    return this.investmentService.getUserInvestments(req.user.id);
  }

  @Get('opportunities')
  getOpportunities(@Req() req: AuthenticatedRequest) {
    return this.investmentService.getOpportunities(req.user.id);
  }

  @Get('marketplace')
  getMarketplace(@Query('propertyId') propertyId?: string) {
    return this.investmentService.getMarketplace(propertyId);
  }

  @Get('history')
  getHistory(@Req() req: AuthenticatedRequest) {
    return this.investmentService.getMyHistory(req.user.id);
  }

  @Get('inactive')
  getInactive() {
    return this.investmentService.getInactiveOffers();
  }

  @Get('admin/overview')
  getAdminOverview(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can view investment overview');
    }

    return this.investmentService.getAdminOverview();
  }

  @Post('buy')
  buyShares(
    @Req() req: AuthenticatedRequest,
    @Body() body: { propertyId: string; shares: number },
  ) {
    if (req.user.role !== Role.INVESTOR) {
      throw new ForbiddenException('Only investors can buy shares');
    }

    return this.investmentService.buyInvestmentShares(
      req.user.id,
      body.propertyId,
      Number(body.shares),
    );
  }

  @Post('create')
  createInvestment(
    @Body() body: CreateInvestmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can create investments');
    }

    return this.investmentService.createInvestment(
      body.propertyId,
      body.investorId,
      body.amount,
    );
  }

  @Post('distribute/:propertyId')
  distributeProfit(
    @Param('propertyId') propertyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can distribute profit');
    }

    return this.investmentService.distributeProfit(propertyId);
  }
}