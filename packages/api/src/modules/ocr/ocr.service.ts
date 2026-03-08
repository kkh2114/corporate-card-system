import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OcrExtractedData } from './interfaces/ocr-response.interface';
import { LlmService } from '../llm/llm.service';

const LLM_CORRECTION_PROMPT = `당신은 영수증 OCR 데이터 보정 전문가입니다. 다음 OCR 추출 데이터를 검토하고 보정해주세요.

보정 규칙:
1. 상호명 정규화: 약어를 정식명으로, 오타 수정 (예: "스벅" → "스타벅스", "맥도날드" 유지)
2. 금액 검증: 합계 = 품목별 금액 합산이 맞는지 확인, 불일치 시 수정
3. 카테고리 분류: 다음 중 하나로 분류 - 식음료, 교통, 사무용품, 숙박, 기타
4. 누락 필드 추론: 주소나 상호명으로 업종 추론

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
{
  "merchantName": "보정된 상호명",
  "businessNumber": "사업자번호",
  "address": "주소",
  "amount": 금액(숫자),
  "vat": 부가세(숫자),
  "category": "카테고리",
  "transactionDate": "거래일시",
  "items": [{"name": "품목명", "quantity": 수량, "price": 가격}],
  "corrections": ["보정 내용 설명1", "보정 내용 설명2"]
}`;

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly apiUrl: string;
  private readonly secretKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly llmService: LlmService,
  ) {
    this.apiUrl = this.configService.get<string>('CLOVA_OCR_API_URL', '');
    this.secretKey = this.configService.get<string>('CLOVA_OCR_SECRET_KEY', '');
  }

  async processReceipt(imageUrl: string): Promise<OcrExtractedData> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          images: [{ format: 'jpg', name: 'receipt', url: imageUrl }],
          requestId: `req-${Date.now()}`,
          timestamp: Date.now(),
          version: 'V2',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-OCR-SECRET': this.secretKey,
          },
          timeout: 30000,
        },
      );

      const ocrData = this.parseOcrResponse(response.data);
      return this.correctWithLlm(ocrData);
    } catch (error) {
      this.logger.error('OCR API call failed', error);
      throw error;
    }
  }

  async scanReceipt(imageUrl: string): Promise<OcrExtractedData> {
    return this.processReceipt(imageUrl);
  }

  private async correctWithLlm(ocrData: OcrExtractedData): Promise<OcrExtractedData> {
    if (!this.llmService.isConfigured()) {
      this.logger.warn('LLM not configured, returning raw OCR result');
      return ocrData;
    }

    try {
      const ocrSummary = JSON.stringify({
        merchantName: ocrData.merchantName,
        businessNumber: ocrData.businessNumber,
        address: ocrData.address,
        amount: ocrData.amount,
        vat: ocrData.vat,
        category: ocrData.category,
        transactionDate: ocrData.transactionDate,
        items: ocrData.items,
      });

      const llmResponse = await this.llmService.chat(
        `OCR 추출 데이터:\n${ocrSummary}`,
        { systemPrompt: LLM_CORRECTION_PROMPT, temperature: 0.1, maxTokens: 1024 },
      );

      const corrected = this.parseLlmCorrection(llmResponse.content);
      if (!corrected) {
        this.logger.warn('Failed to parse LLM correction, using raw OCR result');
        return ocrData;
      }

      return {
        ...ocrData,
        merchantName: corrected.merchantName || ocrData.merchantName,
        businessNumber: corrected.businessNumber || ocrData.businessNumber,
        address: corrected.address || ocrData.address,
        amount: corrected.amount ?? ocrData.amount,
        vat: corrected.vat ?? ocrData.vat,
        category: corrected.category || ocrData.category,
        transactionDate: corrected.transactionDate || ocrData.transactionDate,
        items: corrected.items?.length ? corrected.items : ocrData.items,
        llmCorrected: true,
        corrections: corrected.corrections || [],
      };
    } catch (error: any) {
      this.logger.error(`LLM correction failed: ${error.message}`);
      return ocrData;
    }
  }

  private parseLlmCorrection(content: string): any | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }

  private parseOcrResponse(rawResult: any): OcrExtractedData {
    const result = rawResult?.images?.[0]?.receipt?.result;

    if (!result) {
      return {
        merchantName: '',
        businessNumber: '',
        address: '',
        amount: 0,
        vat: 0,
        category: '',
        transactionDate: '',
        items: [],
        confidence: 0,
        rawResult,
      };
    }

    const storeInfo = result.storeInfo || {};
    const paymentInfo = result.paymentInfo || {};
    const subResults = result.subResults || [];

    const items = subResults.map((item: any) => ({
      name: item.name?.text || '',
      quantity: parseInt(item.count?.text || '1', 10),
      price: parseInt((item.price?.price?.text || '0').replace(/[,]/g, ''), 10),
    }));

    const totalAmount = parseInt(
      (paymentInfo.price?.price?.text || '0').replace(/[,]/g, ''),
      10,
    );

    return {
      merchantName: storeInfo.name?.text || '',
      businessNumber: storeInfo.bizNum?.text || '',
      address: (storeInfo.addresses || []).map((a: any) => a.text).join(' '),
      amount: totalAmount,
      vat: Math.round(totalAmount / 11),
      category: storeInfo.subName?.text || '',
      transactionDate: paymentInfo.date?.text || '',
      items,
      confidence: rawResult?.images?.[0]?.receipt?.meta?.confidence || 0,
      rawResult,
    };
  }
}
