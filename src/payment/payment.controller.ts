import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ResidentPayWalletDto } from './dto/resident-pay-wallet.dto';
import { ResidentInitiatePaymentDto } from './dto/resident-initiate-payment.dto';
import { PaymentChannel, PaymentProvider, Role } from '@prisma/client';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('payments')
@UseGuards(JwtGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  /**
   * =========================================
   * ✅ ADMIN MANUAL PAYMENT RECORD
   * =========================================
   */
  @Post()
  @Roles(Role.ADMIN)
  recordPayment(@Body() dto: CreatePaymentDto) {
    return this.service.recordPayment(dto);
  }

  /**
   * =========================================
   * ✅ RESIDENT INITIATE MOBILE MONEY PAYMENT
   * Flutterwave / MTN-ready
   * =========================================
   */
  @Post('initiate/mobile-money')
  @Roles(Role.RESIDENT)
  initiateMobileMoneyPayment(
    @Req() req: AuthenticatedRequest,
    @Body()
    dto: {
      invoiceId: string;
      amount: number;
      provider?: PaymentProvider;
      providerRef?: string;
    },
  ) {
    if (!dto.invoiceId) {
      throw new BadRequestException('invoiceId is required');
    }

    if (!dto.amount || Number(dto.amount) <= 0) {
      throw new BadRequestException('Valid amount is required');
    }

    const provider = dto.provider ?? PaymentProvider.FLUTTERWAVE;

    if (
      provider !== PaymentProvider.FLUTTERWAVE &&
      provider !== PaymentProvider.ONAFRIQ
    ) {
      throw new BadRequestException(
        'Mobile money provider must be FLUTTERWAVE or ONAFRIQ',
      );
    }

    return this.service.initiateResidentExternalPayment(req.user.id, {
      invoiceId: dto.invoiceId,
      amount: Number(dto.amount),
      channel: PaymentChannel.MOBILE_MONEY,
      provider,
      providerRef: dto.providerRef,
    });
  }

  /**
   * =========================================
   * ✅ RESIDENT INITIATE CARD PAYMENT
   * Stripe / Flutterwave card-ready
   * =========================================
   */
  @Post('initiate/card')
  @Roles(Role.RESIDENT)
  initiateCardPayment(
    @Req() req: AuthenticatedRequest,
    @Body()
    dto: {
      invoiceId: string;
      amount: number;
      provider?: PaymentProvider;
      providerRef?: string;
    },
  ) {
    if (!dto.invoiceId) {
      throw new BadRequestException('invoiceId is required');
    }

    if (!dto.amount || Number(dto.amount) <= 0) {
      throw new BadRequestException('Valid amount is required');
    }

    const provider = dto.provider ?? PaymentProvider.FLUTTERWAVE;

    if (
      provider !== PaymentProvider.FLUTTERWAVE &&
      provider !== PaymentProvider.STRIPE
    ) {
      throw new BadRequestException(
        'Card provider must be FLUTTERWAVE or STRIPE',
      );
    }

    return this.service.initiateResidentExternalPayment(req.user.id, {
      invoiceId: dto.invoiceId,
      amount: Number(dto.amount),
      channel: PaymentChannel.CARD,
      provider,
      providerRef: dto.providerRef,
    });
  }

  /**
   * =========================================
   * ✅ ADMIN PAYMENTS VIEW
   * =========================================
   */
  @Get()
  @Roles(Role.ADMIN)
  getAdminPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const parsedPage = Number(page ?? 1);
    const parsedLimit = Number(limit ?? 20);

    return this.service.getAdminPayments({
      page: Number.isNaN(parsedPage) ? 1 : parsedPage,
      limit: Number.isNaN(parsedLimit) ? 20 : parsedLimit,
      search,
    });
  }

  /**
   * =========================================
   * ✅ MANAGER PAYMENTS VIEW
   * =========================================
   */
  @Get('manager/me')
  @Roles(Role.MANAGER)
  getManagerPayments(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const parsedPage = Number(page ?? 1);
    const parsedLimit = Number(limit ?? 20);

    return this.service.getManagerPayments(req.user.id, {
      page: Number.isNaN(parsedPage) ? 1 : parsedPage,
      limit: Number.isNaN(parsedLimit) ? 20 : parsedLimit,
      search,
    });
  }

  /**
   * =========================================
   * ✅ RESIDENT PAYMENTS VIEW
   * =========================================
   */
  @Get('resident/me')
  @Roles(Role.RESIDENT)
  getResidentPayments(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = Number(page ?? 1);
    const parsedLimit = Number(limit ?? 10);

    return this.service.getResidentPayments(
      req.user.id,
      Number.isNaN(parsedPage) ? 1 : parsedPage,
      Number.isNaN(parsedLimit) ? 10 : parsedLimit,
    );
  }

  @Get('resident/summary')
  @Roles(Role.RESIDENT)
  getResidentPaymentSummary(@Req() req: AuthenticatedRequest) {
    return this.service.getResidentPaymentSummary(req.user.id);
  }

  /**
   * =========================================
   * ✅ RESIDENT PAY FROM WALLET
   * =========================================
   */
  @Post('resident/pay-wallet')
  @Roles(Role.RESIDENT)
  payResidentInvoiceFromWallet(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ResidentPayWalletDto,
  ) {
    return this.service.payResidentInvoiceFromWallet(req.user.id, dto);
  }

  /**
   * =========================================
   * ✅ LEGACY RESIDENT INITIATE EXTERNAL PAYMENT
   * kept so existing frontend does not break
   * =========================================
   */
  @Post('resident/initiate')
  @Roles(Role.RESIDENT)
  initiateResidentExternalPayment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ResidentInitiatePaymentDto,
  ) {
    return this.service.initiateResidentExternalPayment(req.user.id, dto);
  }

  /**
   * =========================================
   * 🔥 QUICK TEST ROUTE
   * =========================================
   */
  @Post('test')
  @Roles(Role.ADMIN)
  async testPayment(@Body() body: any) {
    const { invoiceId, amount } = body;

    if (!invoiceId) {
      throw new BadRequestException('invoiceId is required');
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('Valid amount is required');
    }

    return this.service.recordPayment({
      invoiceId,
      amount: Number(amount),
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.ONAFRIQ,
      providerRef: `TEST-${Date.now()}`,
    });
  }
}