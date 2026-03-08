export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  role: 'employee' | 'manager' | 'finance' | 'admin' | 'auditor';
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address?: string;
}

export interface ImageData {
  uri: string;
  fileName: string;
  fileSize: number;
  type: string;
  width: number;
  height: number;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  employee: {
    id: string;
    name: string;
    department: string;
  };
  amount: number;
  vat: number;
  merchantName: string;
  category: string;
  transactionDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  rejectionReason?: string;
  receiptUrl: string;
  verification: {
    locationVerified: boolean;
    categoryVerified: boolean;
    regionVerified: boolean;
    limitVerified: boolean;
    distanceDifference: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDetail extends Transaction {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    department: string;
    position: string;
  };
  businessNumber: string;
  receipt: {
    id: string;
    fileUrl: string;
    uploadedAt: string;
    ocrConfidence: number;
  };
  ocrResult: {
    merchantName: string;
    address: string;
    amount: number;
    items: Array<{ name: string; quantity: number; price: number }>;
  };
  location: {
    uploadGps: { latitude: number; longitude: number; accuracy: number };
    receiptAddress: string;
    receiptGps: { latitude: number; longitude: number };
    distance: number;
  };
  verificationLogs: Array<{
    type: 'location' | 'category' | 'region' | 'limit' | 'time';
    result: 'pass' | 'fail' | 'warning';
    expectedValue?: string;
    actualValue?: string;
    reason: string;
    verifiedAt: string;
  }>;
}

export interface VerificationResult {
  location: { status: 'pass' | 'warning' | 'fail'; distance: number; message: string };
  category: { status: 'pass' | 'fail'; message: string };
  region: { status: 'pass' | 'fail'; message: string };
  limit: {
    status: 'pass' | 'fail';
    remainingDaily: number;
    remainingMonthly: number;
    message: string;
  };
}

export interface TransactionCompleteEvent {
  type: 'transaction_complete';
  data: {
    transactionId: string;
    status: 'approved' | 'rejected' | 'flagged';
    amount: number;
    merchantName: string;
    category: string;
    verificationResults: VerificationResult;
    message: string;
    rejectionReason?: string;
  };
}

export interface UploadReceiptResponse {
  success: true;
  data: {
    transactionId: string;
    receiptId: string;
    status: 'processing';
    estimatedTime: number;
    websocketChannel: string;
  };
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
