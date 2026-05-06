import { Module } from '@nestjs/common';
import { RentContractService } from './rent-contract.service';
import { RentContractController } from './rent-contract.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RentContractController],
  providers: [RentContractService],
})
export class RentContractModule {}