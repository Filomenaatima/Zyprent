import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RentService } from './rent.service';

@Controller('rent')
export class RentController {
  constructor(private readonly rentService: RentService) {}

  @Post('invoice')
  createInvoice(@Body() dto: any) {
    return this.rentService.createInvoice(dto);
  }

  @Post('payment')
  recordPayment(@Body() dto: any) {
    return this.rentService.recordPayment(dto);
  }

  @Get('ledger/:accountId')
  getLedger(@Param('accountId') accountId: string) {
    return this.rentService.getLedger(accountId);
  }
}
