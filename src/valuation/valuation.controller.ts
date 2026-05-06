import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ValuationService } from './valuation.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('valuation')
@UseGuards(JwtGuard)
export class ValuationController {
  constructor(private valuation: ValuationService) {}

  @Get(':propertyId')
  getPropertyValuation(@Param('propertyId') propertyId: string) {
    return this.valuation.calculatePropertyValue(propertyId);
  }
}