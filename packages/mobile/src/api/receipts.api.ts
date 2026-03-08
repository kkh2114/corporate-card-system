import apiClient from './client';
import type { LocationData, UploadReceiptResponse } from '../types/models.types';
import type { ScanResultData } from '../types/navigation.types';

interface UploadParams {
  imageUri: string;
  fileName: string;
  fileType: string;
  gps: LocationData;
  note?: string;
  isDelivery?: boolean;
  isOnline?: boolean;
}

interface ScanResponse {
  success: true;
  data: {
    receiptId: string;
    ocrResult: ScanResultData;
  };
}

interface ConfirmParams {
  receiptId: string;
  merchantName: string;
  amount: number;
  vat?: number;
  category: string;
  address?: string;
  transactionDate?: string;
  businessNumber?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

interface ConfirmResponse {
  success: true;
  data: {
    receiptId: string;
    status: string;
    merchantName: string;
    amount: number;
    category: string;
  };
}

export const receiptsApi = {
  upload: async (params: UploadParams) => {
    const formData = new FormData();

    formData.append('file', {
      uri: params.imageUri,
      name: params.fileName,
      type: params.fileType,
    } as unknown as Blob);

    formData.append(
      'gps',
      JSON.stringify({
        latitude: params.gps.latitude,
        longitude: params.gps.longitude,
        accuracy: params.gps.accuracy,
        timestamp: params.gps.timestamp,
      }),
    );

    if (params.note || params.isDelivery || params.isOnline) {
      formData.append(
        'metadata',
        JSON.stringify({
          note: params.note,
          isDelivery: params.isDelivery,
          isOnline: params.isOnline,
        }),
      );
    }

    const response = await apiClient.post<UploadReceiptResponse>(
      '/receipts/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.data;
  },

  scan: async (params: UploadParams) => {
    const formData = new FormData();

    formData.append('file', {
      uri: params.imageUri,
      name: params.fileName,
      type: params.fileType,
    } as unknown as Blob);

    formData.append(
      'gps',
      JSON.stringify({
        latitude: params.gps.latitude,
        longitude: params.gps.longitude,
        accuracy: params.gps.accuracy,
        timestamp: params.gps.timestamp,
      }),
    );

    if (params.note || params.isDelivery || params.isOnline) {
      formData.append(
        'metadata',
        JSON.stringify({
          note: params.note,
          isDelivery: params.isDelivery,
          isOnline: params.isOnline,
        }),
      );
    }

    const response = await apiClient.post<ScanResponse>(
      '/receipts/scan',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 },
    );
    return response.data.data;
  },

  confirm: async (params: ConfirmParams) => {
    const response = await apiClient.post<ConfirmResponse>(
      '/receipts/confirm',
      params,
    );
    return response.data.data;
  },
};
