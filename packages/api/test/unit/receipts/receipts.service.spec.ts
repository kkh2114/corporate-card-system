import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ReceiptsService } from '@/modules/receipts/receipts.service';
import { Receipt, ReceiptStatus } from '@/modules/receipts/entities/receipt.entity';
import { OcrService } from '@/modules/ocr/ocr.service';

describe('ReceiptsService', () => {
  let service: ReceiptsService;
  let ocrService: jest.Mocked<Partial<OcrService>>;

  const mockReceipt: Partial<Receipt> = {
    id: 'receipt-uuid-1',
    employeeId: 'emp-uuid-1',
    fileUrl: 'https://s3.local/receipts/test.jpg',
    fileKey: 'receipts/test.jpg',
    originalFilename: 'test.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    status: ReceiptStatus.UPLOADED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOcrResult = {
    merchantName: '스타벅스 강남점',
    businessNumber: '123-45-67890',
    address: '서울시 강남구 테헤란로 123',
    amount: 15000,
    vat: 1500,
    category: '식비',
    transactionDate: '2026-03-05',
    items: [{ name: '아메리카노', quantity: 2, price: 9000 }],
    confidence: 95.5,
    rawResult: { raw: 'data' },
  };

  const mockReceiptRepository = {
    create: jest.fn().mockImplementation((data) => ({ ...data })),
    save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'receipt-uuid-1', ...data })),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    ocrService = {
      processReceipt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptsService,
        { provide: getRepositoryToken(Receipt), useValue: mockReceiptRepository },
        { provide: OcrService, useValue: ocrService },
      ],
    }).compile();

    service = module.get<ReceiptsService>(ReceiptsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a receipt with UPLOADED status', async () => {
      const result = await service.create(
        'emp-uuid-1',
        'https://s3.local/receipts/test.jpg',
        'receipts/test.jpg',
        'test.jpg',
        1024000,
        'image/jpeg',
      );

      expect(mockReceiptRepository.create).toHaveBeenCalledWith({
        employeeId: 'emp-uuid-1',
        fileUrl: 'https://s3.local/receipts/test.jpg',
        fileKey: 'receipts/test.jpg',
        originalFilename: 'test.jpg',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
        status: ReceiptStatus.UPLOADED,
      });
      expect(mockReceiptRepository.save).toHaveBeenCalled();
    });
  });

  describe('processOcr', () => {
    it('should process OCR and update receipt with results', async () => {
      mockReceiptRepository.findOne.mockResolvedValue({ ...mockReceipt });
      ocrService.processReceipt.mockResolvedValue(mockOcrResult);

      const result = await service.processOcr('receipt-uuid-1');

      // First save: status -> PROCESSING
      expect(mockReceiptRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReceiptStatus.PROCESSING }),
      );

      // Second save: status -> COMPLETED with OCR data
      expect(mockReceiptRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReceiptStatus.COMPLETED,
          merchantName: '스타벅스 강남점',
          businessNumber: '123-45-67890',
          address: '서울시 강남구 테헤란로 123',
          amount: 15000,
          vat: 1500,
          category: '식비',
          ocrConfidence: 95.5,
        }),
      );
    });

    it('should set status to FAILED when OCR processing fails', async () => {
      mockReceiptRepository.findOne.mockResolvedValue({ ...mockReceipt });
      ocrService.processReceipt.mockRejectedValue(new Error('OCR API error'));

      await expect(service.processOcr('receipt-uuid-1')).rejects.toThrow('OCR API error');

      expect(mockReceiptRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReceiptStatus.FAILED }),
      );
    });

    it('should throw NotFoundException when receipt does not exist', async () => {
      mockReceiptRepository.findOne.mockResolvedValue(null);

      await expect(service.processOcr('nonexist')).rejects.toThrow(NotFoundException);
    });

    it('should set transactionDate to null when OCR returns no date', async () => {
      mockReceiptRepository.findOne.mockResolvedValue({ ...mockReceipt });
      ocrService.processReceipt.mockResolvedValue({
        ...mockOcrResult,
        transactionDate: null,
      });

      await service.processOcr('receipt-uuid-1');

      expect(mockReceiptRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ transactionDate: null }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a receipt by id', async () => {
      mockReceiptRepository.findOne.mockResolvedValue(mockReceipt);

      const result = await service.findOne('receipt-uuid-1');

      expect(result).toEqual(mockReceipt);
      expect(mockReceiptRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'receipt-uuid-1' },
      });
    });

    it('should throw NotFoundException when receipt not found', async () => {
      mockReceiptRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexist')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmployeeId', () => {
    it('should return receipts for an employee ordered by createdAt DESC', async () => {
      const receipts = [mockReceipt, { ...mockReceipt, id: 'receipt-uuid-2' }];
      mockReceiptRepository.find.mockResolvedValue(receipts);

      const result = await service.findByEmployeeId('emp-uuid-1');

      expect(result).toHaveLength(2);
      expect(mockReceiptRepository.find).toHaveBeenCalledWith({
        where: { employeeId: 'emp-uuid-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no receipts found', async () => {
      mockReceiptRepository.find.mockResolvedValue([]);

      const result = await service.findByEmployeeId('emp-no-receipts');

      expect(result).toEqual([]);
    });
  });
});
