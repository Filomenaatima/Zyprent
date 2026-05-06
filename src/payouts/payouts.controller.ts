import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { CreateProviderWithdrawalDto } from './dto/create-provider-withdrawal.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post()
  async requestPayout(@Body() dto: CreatePayoutDto) {
    return this.payoutsService.requestPayout(dto);
  }

  @Get('provider/wallet')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SERVICE_PROVIDER')
  async getProviderWallet(@Req() req: Request) {
    const userId = (req.user as any).id as string;
    return this.payoutsService.getProviderWallet(userId);
  }

  @Post('provider/withdraw')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SERVICE_PROVIDER')
  async requestProviderWithdrawal(
    @Req() req: Request,
    @Body() dto: CreateProviderWithdrawalDto,
  ) {
    const userId = (req.user as any).id as string;
    return this.payoutsService.requestProviderWithdrawal(userId, dto);
  }

  @Post('provider/repair-legacy')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SERVICE_PROVIDER')
  async repairLegacyProviderPayouts(@Req() req: Request) {
    const userId = (req.user as any).id as string;
    return this.payoutsService.repairLegacyProviderPayoutsForUser(userId);
  }
}