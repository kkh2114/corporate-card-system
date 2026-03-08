import { useState, useCallback } from 'react';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { isValidImageSize } from '../utils/validation';
import type { ImageData } from '../types/models.types';

export function useCamera() {
  const [image, setImage] = useState<ImageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = useCallback(async (): Promise<ImageData | null> => {
    setError(null);
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 2048,
      maxHeight: 2048,
    });

    if (result.didCancel || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    if (!asset.uri || !asset.fileSize) {
      setError('이미지 정보를 가져올 수 없습니다.');
      return null;
    }

    if (!isValidImageSize(asset.fileSize)) {
      setError('10MB 이하 이미지만 업로드할 수 있습니다.');
      return null;
    }

    const imageData: ImageData = {
      uri: asset.uri,
      fileName: asset.fileName ?? `receipt_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
      type: asset.type ?? 'image/jpeg',
      width: asset.width ?? 0,
      height: asset.height ?? 0,
    };

    setImage(imageData);
    return imageData;
  }, []);

  const pickFromGallery = useCallback(async (): Promise<ImageData | null> => {
    setError(null);
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 2048,
      maxHeight: 2048,
    });

    if (result.didCancel || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    if (!asset.uri || !asset.fileSize) {
      setError('이미지 정보를 가져올 수 없습니다.');
      return null;
    }

    if (!isValidImageSize(asset.fileSize)) {
      setError('10MB 이하 이미지만 업로드할 수 있습니다.');
      return null;
    }

    const imageData: ImageData = {
      uri: asset.uri,
      fileName: asset.fileName ?? `receipt_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
      type: asset.type ?? 'image/jpeg',
      width: asset.width ?? 0,
      height: asset.height ?? 0,
    };

    setImage(imageData);
    return imageData;
  }, []);

  const clearImage = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  return { image, error, takePhoto, pickFromGallery, clearImage };
}
