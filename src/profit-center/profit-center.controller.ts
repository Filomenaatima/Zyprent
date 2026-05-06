import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ProfitCenterService } from './profit-center.service';

@Controller('profit-center')
@UseGuards(JwtGuard)
export class ProfitCenterController {
  constructor(private readonly profitCenterService: ProfitCenterService) {}

  @Get('me')
  async getMyProfitCenter(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.profitCenterService.getInvestorProfitCenter(userId);
  }
}