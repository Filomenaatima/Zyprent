import { Controller, Post, Body } from '@nestjs/common';
import { MoveOutService } from './move-out.service';

@Controller('move-out')
export class MoveOutController {
  constructor(private readonly service: MoveOutService) {}

  @Post()
  async processMoveOut(
    @Body()
    body: {
      residentId: string;
      damageAmount?: number;
    },
  ) {
    return this.service.reconcileMoveOut({
      residentId: body.residentId,
      damageAmount: body.damageAmount ?? 0,
    });
  }
}
