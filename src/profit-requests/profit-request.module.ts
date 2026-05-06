import { Module } from '@nestjs/common';
import { ProfitRequestService } from './profit-request.service';
import { ProfitRequestController } from './profit-request.controller';
import { ProfitDistributionsModule } from '../profit-distributions/profit-distributions.module';

@Module({
  imports: [
    ProfitDistributionsModule, 
  ],
  controllers: [ProfitRequestController],
  providers: [ProfitRequestService],
})
export class ProfitRequestModule {}