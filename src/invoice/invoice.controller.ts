import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InvoiceService } from './invoice.service';
import { ManagerInvoiceQueryDto } from './dto/manager-invoice-query.dto';
import { SettleInvoiceDto } from './dto/settle-invoice.dto';
import { Role } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('invoices')
@UseGuards(JwtGuard, RolesGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('generate/:rentContractId')
  @Roles(Role.ADMIN, Role.MANAGER)
  async generate(
    @Req() req: AuthenticatedRequest,
    @Param('rentContractId') rentContractId: string,
    @Query('months') months?: string,
    @Query('manual') manual?: string,
  ) {
    return this.invoiceService.generateInvoiceByUser(
      req.user.id,
      req.user.role,
      rentContractId,
      months ? Number(months) : 1,
      manual === 'true',
    );
  }

  @Get()
  @Roles(Role.ADMIN)
  async getAllInvoices(
    @Query() query: ManagerInvoiceQueryDto,
  ) {
    return this.invoiceService.getAdminInvoices(query);
  }

  @Get('manager/me')
  @Roles(Role.MANAGER)
  async getManagerInvoices(
    @Req() req: AuthenticatedRequest,
    @Query() query: ManagerInvoiceQueryDto,
  ) {
    return this.invoiceService.getManagerInvoices(req.user.id, query);
  }

  @Get('resident/me')
  @Roles(Role.RESIDENT)
  async getResidentInvoices(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.invoiceService.getResidentInvoices(req.user.id, {
      page: Number(page ?? 1),
      limit: Number(limit ?? 10),
      status,
      search,
    });
  }

  @Get('resident/me/current')
  @Roles(Role.RESIDENT)
  async getResidentCurrentInvoice(@Req() req: AuthenticatedRequest) {
    return this.invoiceService.getResidentCurrentInvoice(req.user.id);
  }

  @Get('manager/:invoiceId')
  @Roles(Role.MANAGER)
  async getManagerInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.invoiceService.getManagerInvoice(req.user.id, invoiceId);
  }

  @Post(':invoiceId/settle')
  @Roles(Role.MANAGER, Role.ADMIN)
  async settleInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: SettleInvoiceDto,
  ) {
    return this.invoiceService.settleInvoiceByUser(
      req.user.id,
      req.user.role,
      invoiceId,
      dto,
    );
  }

  @Post(':invoiceId/remind')
  @Roles(Role.MANAGER, Role.ADMIN)
  async sendReminder(
    @Req() req: AuthenticatedRequest,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.invoiceService.sendReminderByUser(
      req.user.id,
      req.user.role,
      invoiceId,
    );
  }

  @Get(':invoiceId/download')
  @Roles(Role.ADMIN, Role.MANAGER, Role.RESIDENT)
  async downloadInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.invoiceService.getInvoiceDownloadPayloadByUser(
      req.user.id,
      req.user.role,
      invoiceId,
    );
  }

  @Get(':invoiceId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.RESIDENT)
  async getOne(
    @Req() req: AuthenticatedRequest,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.invoiceService.getInvoiceByUser(
      req.user.id,
      req.user.role,
      invoiceId,
    );
  }
}