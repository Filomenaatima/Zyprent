import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatementService } from './statements.service';

@Controller('statements')
export class StatementsController {
  constructor(private readonly statements: StatementService) {}

  @Get('resident/:residentId')
  residentStatement(
    @Param('residentId') residentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statements.residentStatement(
      residentId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
