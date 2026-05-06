import { Module } from '@nestjs/common';
import { InvestorShareService } from './investor-share.service';
import { InvestorShareController } from './investor-share.controller';

@Module({
  controllers: [InvestorShareController],
  providers: [InvestorShareService],
})
export class InvestorShareModule {}