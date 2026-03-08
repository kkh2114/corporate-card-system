import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardPolicy } from './entities/card-policy.entity';
import { PolicyRule } from './entities/policy-rule.entity';
import { PoliciesService } from './policies.service';
import { PolicyEngineService } from './policy-engine.service';
import { PoliciesController } from './policies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CardPolicy, PolicyRule])],
  controllers: [PoliciesController],
  providers: [PoliciesService, PolicyEngineService],
  exports: [PoliciesService, PolicyEngineService],
})
export class PoliciesModule {}
