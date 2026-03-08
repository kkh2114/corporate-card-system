import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { LocationValidator } from './validators/location.validator';
import { CategoryValidator } from './validators/category.validator';
import { RegionValidator } from './validators/region.validator';
import { LimitValidator } from './validators/limit.validator';
import { TimeValidator } from './validators/time.validator';

@Module({
  providers: [
    VerificationService,
    LocationValidator,
    CategoryValidator,
    RegionValidator,
    LimitValidator,
    TimeValidator,
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
