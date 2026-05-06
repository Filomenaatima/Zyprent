import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProfitRequestService } from './profit-request.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateProfitRequestDto } from './dto/create-profit-request.dto';
import { VoteDto } from './dto/vote.dto';

@Controller('profit-requests')
@UseGuards(JwtGuard)
export class ProfitRequestController {
  constructor(private service: ProfitRequestService) {}

  @Post()
  create(@Req() req: Request, @Body() body: CreateProfitRequestDto) {
    return this.service.createRequest((req as any).user.id, body);
  }

  @Post('vote')
  vote(@Req() req: Request, @Body() body: VoteDto) {
    return this.service.vote((req as any).user.id, body);
  }
}