import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PropertyAdminController } from './property-admin.controller';
import { PropertyAdminService } from './property-admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [PropertyAdminController],
  providers: [PropertyAdminService],
  exports: [PropertyAdminService],
})
export class PropertyAdminModule {}