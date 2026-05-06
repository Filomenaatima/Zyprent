import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { ListSharesDto } from './dto/list-shares.dto';
import { BuyListedSharesDto } from './dto/buy-listed-shares.dto';
import { LedgerSource } from '@prisma/client';

@Injectable()
export class ShareMarketService {

  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

  /*
  LIST SHARES FOR SALE
  */

  async listShares(dto: ListSharesDto) {

    const investorShare = await this.prisma.investorShare.findUnique({
      where: {
        investorId_propertyId: {
          investorId: dto.investorId,
          propertyId: dto.propertyId,
        },
      },
    });

    if (!investorShare) {
      throw new NotFoundException('Investor does not own shares');
    }

    if (dto.shares > investorShare.sharesOwned) {
      throw new BadRequestException('Not enough shares to list');
    }

    return this.prisma.shareListing.create({
      data: {
        investorId: dto.investorId,
        propertyId: dto.propertyId,
        shares: dto.shares,
        pricePerShare: dto.pricePerShare,
        isActive: true,
      },
    });
  }

  /*
  GET LISTINGS
  */

  async getListings(propertyId: string) {

    return this.prisma.shareListing.findMany({
      where: {
        propertyId,
        isActive: true,
      },
      include: {
        investor: true,
      },
      orderBy: {
        pricePerShare: 'asc',
      },
    });

  }

  /*
  BUY LISTED SHARES
  */

  async buyListedShares(dto: BuyListedSharesDto) {

    const listing = await this.prisma.shareListing.findUnique({
      where: { id: dto.listingId },
    });

    if (!listing || !listing.isActive) {
      throw new NotFoundException('Listing not found');
    }

    if (dto.shares > listing.shares) {
      throw new BadRequestException('Not enough shares in listing');
    }

    const amount = dto.shares * listing.pricePerShare;

    /*
    CHECK BUYER WALLET
    */

    const balance = await this.ledger.getBalance(dto.buyerId);

    if (balance.toNumber() < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    /*
    SELLER SHARE RECORD
    */

    const sellerShare = await this.prisma.investorShare.findUnique({
      where: {
        investorId_propertyId: {
          investorId: listing.investorId,
          propertyId: listing.propertyId,
        },
      },
    });

    if (!sellerShare) {
      throw new BadRequestException('Seller shares missing');
    }

    /*
    REDUCE SELLER SHARES
    */

    await this.prisma.investorShare.update({
      where: { id: sellerShare.id },
      data: {
        sharesOwned: sellerShare.sharesOwned - dto.shares,
      },
    });

    /*
    BUYER SHARE RECORD
    */

    const buyerExisting = await this.prisma.investorShare.findUnique({
      where: {
        investorId_propertyId: {
          investorId: dto.buyerId,
          propertyId: listing.propertyId,
        },
      },
    });

    let buyerShare;

    if (buyerExisting) {

      buyerShare = await this.prisma.investorShare.update({
        where: { id: buyerExisting.id },
        data: {
          sharesOwned: buyerExisting.sharesOwned + dto.shares,
          amountPaid: buyerExisting.amountPaid + amount,
        },
      });

    } else {

      buyerShare = await this.prisma.investorShare.create({
        data: {
          investorId: dto.buyerId,
          propertyId: listing.propertyId,
          offerId: sellerShare.offerId,
          sharesOwned: dto.shares,
          amountPaid: amount,
        },
      });

    }

    /*
    UPDATE LISTING
    */

    const remaining = listing.shares - dto.shares;

    await this.prisma.shareListing.update({
      where: { id: listing.id },
      data: {
        shares: remaining,
        isActive: remaining > 0,
      },
    });

    /*
    RECORD TRANSACTION
    */

    await this.prisma.shareTransaction.create({
      data: {
        investorId: dto.buyerId,
        propertyId: listing.propertyId,
        investorShareId: buyerShare.id,
        shares: dto.shares,
        amount,
        type: 'TRANSFER',
      },
    });

    /*
    LEDGER TRANSFER
    */

    await this.ledger.recordDoubleEntry({
      debitAccountId: dto.buyerId,
      creditAccountId: listing.investorId,
      amount,
      source: LedgerSource.INVESTMENT,
      reference: 'Secondary market share trade',
      propertyId: listing.propertyId,
    });

    return {
      message: 'Shares purchased from marketplace',
      shares: dto.shares,
      amount,
    };
  }

  /*
  CANCEL LISTING
  */

  async cancelListing(listingId: string) {

    const listing = await this.prisma.shareListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.prisma.shareListing.update({
      where: { id: listingId },
      data: {
        isActive: false,
      },
    });

  }

}