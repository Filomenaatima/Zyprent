import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('provider/me')
  @Roles('SERVICE_PROVIDER')
  async getProviderReviews(@Req() req: Request) {
    const userId = (req.user as any).id as string;
    return this.reviewsService.getProviderReviews(userId);
  }
}