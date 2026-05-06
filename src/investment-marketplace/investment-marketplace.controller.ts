import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { InvestmentMarketplaceService } from './investment-marketplace.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { BuySharesDto } from './dto/buy-shares.dto';

@Controller('investment-offers')
export class InvestmentMarketplaceController {
  constructor(private service: InvestmentMarketplaceService) {}

  @Post()
  createOffer(@Body() dto: CreateOfferDto) {
    return this.service.createOffer(dto);
  }

  @Get()
  getOffers() {
    return this.service.getOffers();
  }

  @Get(':propertyId')
  getOffer(@Param('propertyId') propertyId: string) {
    return this.service.getOffer(propertyId);
  }

  @Post('buy')
  buyShares(@Body() dto: BuySharesDto) {
    return this.service.buyShares(dto);
  }
}