export interface OcrExtractedData {
  merchantName: string;
  businessNumber: string;
  address: string;
  amount: number;
  vat: number;
  category: string;
  transactionDate: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  confidence: number;
  rawResult: Record<string, any>;
  llmCorrected?: boolean;
  corrections?: string[];
}
