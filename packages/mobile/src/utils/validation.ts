import { Config } from '../constants/config';

export function isValidImageSize(fileSize: number): boolean {
  return fileSize <= Config.IMAGE_MAX_SIZE_MB * 1024 * 1024;
}

export function getAccuracyLevel(
  accuracy: number,
): 'good' | 'moderate' | 'poor' {
  if (accuracy <= Config.GPS_ACCURACY_GOOD) return 'good';
  if (accuracy <= Config.GPS_ACCURACY_MODERATE) return 'moderate';
  return 'poor';
}

export function isValidEmployeeId(id: string): boolean {
  return id.length > 0 && id.length <= 20;
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
