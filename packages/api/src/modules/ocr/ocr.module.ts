import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  providers: [OcrService],
  exports: [OcrService],
})
export class OcrModule {}
