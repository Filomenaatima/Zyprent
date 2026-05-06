import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ShareMarketService } from './share-market.service';
import { ListSharesDto } from './dto/list-shares.dto';
import { BuyListedSharesDto } from './dto/buy-listed-shares.dto';

@Controller('share-market')
export class ShareMarketController {

  constructor(private service: ShareMarketService) {}

  @Post('list')
  listShares(@Body() dto: ListSharesDto) {
    return this.service.listShares(dto);
  }

  @Get('listings/:propertyId')
  getListings(@Param('propertyId') propertyId: string) {
    return this.service.getListings(propertyId);
  }

  @Post('buy')
  buyListedShares(@Body() dto: BuyListedSharesDto) {
    return this.service.buyListedShares(dto);
  }

  @Post('cancel/:listingId')
  cancelListing(@Param('listingId') listingId: string) {
    return this.service.cancelListing(listingId);
  }
}