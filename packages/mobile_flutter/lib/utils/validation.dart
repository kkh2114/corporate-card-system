import '../config/app_config.dart';

bool isValidImageSize(int fileSize) {
  return fileSize <= AppConfig.imageMaxSizeMb * 1024 * 1024;
}

String getAccuracyLevel(double accuracy) {
  if (accuracy <= AppConfig.gpsAccuracyGood) return 'good';
  if (accuracy <= AppConfig.gpsAccuracyModerate) return 'moderate';
  return 'poor';
}

bool isValidEmployeeId(String id) {
  return id.isNotEmpty && id.length <= 20;
}

bool isValidPassword(String password) {
  return password.length >= 8;
}
