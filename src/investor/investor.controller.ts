import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { InvestorService } from './investor.service';
import { Request } from 'express';

@Controller('investor')
@UseGuards(JwtGuard)
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  @Get('summary')
  getSummary(@Req() req: Request) {
    const user = req.user as any;
    return this.investorService.getSummary(user.userId);
  }
}
