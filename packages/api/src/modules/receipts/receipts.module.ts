import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receipt } from './entities/receipt.entity';
import { OcrResult } from './entities/ocr-result.entity';
import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';
import { OcrModule } from '../ocr/ocr.module';

@Module({
  imports: [TypeOrmModule.forFeature([Receipt, OcrResult]), OcrModule],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
