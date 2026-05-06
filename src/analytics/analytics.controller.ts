import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get(':propertyId')
  getAnalytics(@Param('propertyId') propertyId: string) {
    return this.analyticsService.propertyAnalytics(propertyId);
  }
}