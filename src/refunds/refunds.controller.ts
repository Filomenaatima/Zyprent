import { Body, Controller, Post } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';

@Controller('refunds')
export class RefundsController {
  constructor(private readonly service: RefundsService) {}

  @Post()
  issueRefund(@Body() body: CreateRefundDto) {
    return this.service.createRefund(body);
  }
}
