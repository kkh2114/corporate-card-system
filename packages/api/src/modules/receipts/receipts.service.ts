import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt, ReceiptStatus } from './entities/receipt.entity';
import { OcrService } from '../ocr/ocr.service';
import { OcrExtractedData } from '../ocr/interfaces/ocr-response.interface';
import { ConfirmReceiptDto } from './dto/confirm-receipt.dto';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    private readonly ocrService: OcrService,
  ) {}

  async create(
    employeeId: string,
    fileUrl: string,
    fileKey: string,
    originalFilename: string,
    fileSize: number,
    mimeType: string,
  ): Promise<Receipt> {
    const receipt = this.receiptRepository.create({
      employeeId, fileUrl, fileKey, originalFilename, fileSize, mimeType,
      status: ReceiptStatus.UPLOADED,
    });
    return this.receiptRepository.save(receipt);
  }

  async processOcr(receiptId: string): Promise<Receipt> {
    const receipt = await this.findOne(receiptId);
    receipt.status = ReceiptStatus.PROCESSING;
    await this.receiptRepository.save(receipt);

    try {
      const ocrResult = await this.ocrService.processReceipt(receipt.fileUrl);

      receipt.merchantName = ocrResult.merchantName;
      receipt.businessNumber = ocrResult.businessNumber;
      receipt.address = ocrResult.address;
      receipt.amount = ocrResult.amount;
      receipt.vat = ocrResult.vat;
      receipt.category = ocrResult.category;
      receipt.transactionDate = ocrResult.transactionDate
        ? new Date(ocrResult.transactionDate)
        : null;
      receipt.items = ocrResult.items;
      receipt.ocrConfidence = ocrResult.confidence;
      receipt.ocrRawResult = ocrResult.rawResult;
      receipt.status = ReceiptStatus.COMPLETED;

      return this.receiptRepository.save(receipt);
    } catch (error) {
      this.logger.error(`OCR processing failed for receipt ${receiptId}`, error);
      receipt.status = ReceiptStatus.FAILED;
      await this.receiptRepository.save(receipt);
      throw error;
    }
  }

  async findOne(id: string): Promise<Receipt> {
    const receipt = await this.receiptRepository.findOne({ where: { id } });
    if (!receipt) {
      throw new NotFoundException(`Receipt #${id} not found`);
    }
    return receipt;
  }

  async findByEmployeeId(employeeId: string): Promise<Receipt[]> {
    return this.receiptRepository.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  async scanReceipt(receiptId: string): Promise<OcrExtractedData> {
    const receipt = await this.findOne(receiptId);
    receipt.status = ReceiptStatus.PROCESSING;
    await this.receiptRepository.save(receipt);

    try {
      const ocrResult = await this.ocrService.scanReceipt(receipt.fileUrl);

      receipt.ocrConfidence = ocrResult.confidence;
      receipt.ocrRawResult = ocrResult.rawResult;
      receipt.merchantName = ocrResult.merchantName;
      receipt.businessNumber = ocrResult.businessNumber;
      receipt.address = ocrResult.address;
      receipt.amount = ocrResult.amount;
      receipt.vat = ocrResult.vat;
      receipt.category = ocrResult.category;
      receipt.transactionDate = ocrResult.transactionDate
        ? new Date(ocrResult.transactionDate)
        : null;
      receipt.items = ocrResult.items;
      receipt.status = ReceiptStatus.COMPLETED;
      await this.receiptRepository.save(receipt);

      return ocrResult;
    } catch (error) {
      this.logger.error(`Scan failed for receipt ${receiptId}`, error);
      receipt.status = ReceiptStatus.FAILED;
      await this.receiptRepository.save(receipt);
      throw error;
    }
  }

  async confirmReceipt(dto: ConfirmReceiptDto): Promise<Receipt> {
    const receipt = await this.findOne(dto.receiptId);

    receipt.merchantName = dto.merchantName;
    receipt.businessNumber = dto.businessNumber || receipt.businessNumber;
    receipt.address = dto.address || receipt.address;
    receipt.amount = dto.amount;
    receipt.vat = dto.vat ?? receipt.vat;
    receipt.category = dto.category;
    receipt.transactionDate = dto.transactionDate
      ? new Date(dto.transactionDate)
      : receipt.transactionDate;
    receipt.items = dto.items || receipt.items;
    receipt.status = ReceiptStatus.COMPLETED;

    return this.receiptRepository.save(receipt);
  }
}
