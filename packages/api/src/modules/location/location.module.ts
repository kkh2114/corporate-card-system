import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationLog } from './entities/location-log.entity';
import { LocationService } from './location.service';

@Module({
  imports: [TypeOrmModule.forFeature([LocationLog])],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
