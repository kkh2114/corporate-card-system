import { create } from 'zustand';
import type { ImageData, LocationData } from '../types/models.types';

interface ProcessingStep {
  key: string;
  label: string;
  completed: boolean;
}

interface ReceiptState {
  currentImage: ImageData | null;
  currentLocation: LocationData | null;
  uploadProgress: number;
  processingSteps: ProcessingStep[];
  setImage: (image: ImageData | null) => void;
  setLocation: (location: LocationData | null) => void;
  setUploadProgress: (progress: number) => void;
  updateProcessingStep: (key: string, completed: boolean) => void;
  reset: () => void;
}

const initialSteps: ProcessingStep[] = [
  { key: 'upload', label: '이미지 업로드', completed: false },
  { key: 'ocr', label: 'OCR 텍스트 추출', completed: false },
  { key: 'location', label: '위치 검증', completed: false },
  { key: 'category', label: '업종 검증', completed: false },
  { key: 'limit', label: '한도 검증', completed: false },
  { key: 'final', label: '최종 판정', completed: false },
];

export const useReceiptStore = create<ReceiptState>((set) => ({
  currentImage: null,
  currentLocation: null,
  uploadProgress: 0,
  processingSteps: [...initialSteps],

  setImage: (image) => set({ currentImage: image }),
  setLocation: (location) => set({ currentLocation: location }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  updateProcessingStep: (key, completed) =>
    set((state) => ({
      processingSteps: state.processingSteps.map((step) =>
        step.key === key ? { ...step, completed } : step,
      ),
    })),

  reset: () =>
    set({
      currentImage: null,
      currentLocation: null,
      uploadProgress: 0,
      processingSteps: [...initialSteps],
    }),
}));
