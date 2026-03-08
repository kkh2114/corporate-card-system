const String _defaultApiUrl = 'http://10.0.2.2:3000/api/v1';
const String _defaultWsUrl = 'ws://10.0.2.2:3000';

class AppConfig {
  static String apiBaseUrl = const String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: _defaultApiUrl,
  );

  static String wsUrl = const String.fromEnvironment(
    'WS_URL',
    defaultValue: _defaultWsUrl,
  );

  static const int requestTimeout = 30000;
  static const int imageMaxSizeMb = 10;
  static const double gpsAccuracyGood = 20;
  static const double gpsAccuracyModerate = 100;
  static const int transactionPageSize = 20;
}
