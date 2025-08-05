import { Module } from '@nestjs/common';
import { CompanyDomainController } from './company-domain.controller';
import { CompanyDomainService } from './company-domain.service';

@Module({
  controllers: [CompanyDomainController],
  providers: [CompanyDomainService],
  exports: [CompanyDomainService],
})
export class CompanyDomainModule {}
