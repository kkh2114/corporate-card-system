export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ReceiptTab: undefined;
  TransactionTab: undefined;
  SettingsTab: undefined;
};

export interface ScanResultData {
  merchantName: string;
  businessNumber: string;
  address: string;
  amount: number;
  vat: number;
  category: string;
  transactionDate: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  confidence: number;
  llmCorrected: boolean;
  corrections: string[];
}

export type ReceiptStackParamList = {
  Upload: undefined;
  Confirm: {
    receiptId: string;
    scanResult: ScanResultData;
  };
  Processing: {
    transactionId: string;
    receiptId: string;
    websocketChannel: string;
  };
  Result: {
    transactionId: string;
    status: 'approved' | 'rejected' | 'flagged';
    message: string;
    rejectionReason?: string;
    verificationResults?: string; // JSON stringified VerificationResult
    amount?: number;
    merchantName?: string;
    category?: string;
  };
};

export type TransactionStackParamList = {
  TransactionList: undefined;
  TransactionDetail: { transactionId: string };
};

export type HomeStackParamList = {
  Home: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};
