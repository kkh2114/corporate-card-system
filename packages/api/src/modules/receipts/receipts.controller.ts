import {
  Controller, Post, Get, Param, ParseUUIDPipe, Body,
  UseInterceptors, UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ReceiptsService } from './receipts.service';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { ConfirmReceiptDto } from './dto/confirm-receipt.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Receipts')
@ApiBearerAuth()
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '영수증 업로드',
    description: '영수증 이미지를 업로드하고 OCR 처리를 시작합니다. GPS 위치 정보를 함께 전송합니다. 최대 파일 크기: 10MB. 지원 형식: JPEG, PNG, GIF, WebP.',
  })
  @ApiBody({
    description: '영수증 이미지 파일과 GPS/메타 정보',
    schema: {
      type: 'object',
      required: ['file', 'gps'],
      properties: {
        file: { type: 'string', format: 'binary', description: '영수증 이미지 파일 (max 10MB)' },
        gps: { type: 'string', description: 'GPS JSON: { latitude, longitude, accuracy, timestamp }' },
        metadata: { type: 'string', description: '메타데이터 JSON: { note?, isDelivery?, isOnline? }' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '업로드 성공. receiptId, status, estimatedTime 반환' })
  @ApiResponse({ status: 400, description: '파일 형식 오류 또는 GPS 데이터 누락' })
  @ApiResponse({ status: 413, description: '파일 크기 초과 (10MB)' })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
        cb(new Error('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async upload(
    @UploadedFile() file: any,
    @Body() dto: UploadReceiptDto,
    @CurrentUser('id') userId: string,
  ) {
    const fileUrl = `uploads/${file.filename}`;
    const fileKey = `receipts/${userId}/${Date.now()}-${file.originalname}`;

    const receipt = await this.receiptsService.create(
      userId, fileUrl, fileKey,
      file.originalname, file.size, file.mimetype,
    );

    // Trigger async OCR processing
    this.receiptsService.processOcr(receipt.id).catch(() => {});

    return {
      receiptId: receipt.id,
      status: 'processing',
      estimatedTime: 3000,
    };
  }

  @Post('scan')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '영수증 스캔 (OCR + LLM 보정)',
    description: '영수증 이미지를 업로드하고 OCR + LLM 보정된 데이터를 반환합니다. 사용자 확인 전 단계입니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'gps'],
      properties: {
        file: { type: 'string', format: 'binary' },
        gps: { type: 'string', description: 'GPS JSON' },
        metadata: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'OCR + LLM 보정 결과 반환' })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
        cb(new Error('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async scan(
    @UploadedFile() file: any,
    @Body() dto: UploadReceiptDto,
    @CurrentUser('id') userId: string,
  ) {
    const fileUrl = `uploads/${file.filename}`;
    const fileKey = `receipts/${userId}/${Date.now()}-${file.originalname}`;

    const receipt = await this.receiptsService.create(
      userId, fileUrl, fileKey,
      file.originalname, file.size, file.mimetype,
    );

    const ocrResult = await this.receiptsService.scanReceipt(receipt.id);

    return {
      receiptId: receipt.id,
      ocrResult: {
        merchantName: ocrResult.merchantName,
        businessNumber: ocrResult.businessNumber,
        address: ocrResult.address,
        amount: ocrResult.amount,
        vat: ocrResult.vat,
        category: ocrResult.category,
        transactionDate: ocrResult.transactionDate,
        items: ocrResult.items,
        confidence: ocrResult.confidence,
        llmCorrected: ocrResult.llmCorrected || false,
        corrections: ocrResult.corrections || [],
      },
    };
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '영수증 확정 제출',
    description: '사용자가 확인/수정한 데이터를 최종 제출합니다. 정책 검증 후 피드백을 반환합니다.',
  })
  @ApiResponse({ status: 200, description: '정책 검증 결과 반환' })
  @ApiResponse({ status: 404, description: '영수증을 찾을 수 없음' })
  async confirm(@Body() dto: ConfirmReceiptDto) {
    const receipt = await this.receiptsService.confirmReceipt(dto);

    return {
      receiptId: receipt.id,
      status: receipt.status,
      merchantName: receipt.merchantName,
      amount: receipt.amount,
      category: receipt.category,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '영수증 상세 조회', description: '영수증 ID로 상세 정보를 조회합니다. OCR 결과 포함.' })
  @ApiParam({ name: 'id', description: '영수증 UUID' })
  @ApiResponse({ status: 200, description: '영수증 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '영수증을 찾을 수 없음' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.receiptsService.findOne(id);
  }
}
