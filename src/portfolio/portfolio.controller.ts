import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PortfolioService } from './portfolio.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('portfolio')
@UseGuards(JwtGuard)
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get()
  async getPortfolio(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.portfolio.getInvestorPortfolio(userId);
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Req() req: Request,
    @Query('limit') limit?: string,
  ) {
    const userId = (req.user as any).id;
    return this.portfolio.getInvestorLeaderboard(
      userId,
      limit ? Number(limit) : 5,
    );
  }
}