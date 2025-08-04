import { Module } from '@nestjs/common';
import { ContentFilterService } from './content-filter.service';
import { PrismaModule } from '../core/prisma/prisma.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [PrismaModule, AdminModule],
  providers: [ContentFilterService],
  exports: [ContentFilterService],
})
export class ContentFilterModule {}
