import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../providers/auth_provider.dart';

class ApiClient {
  late final Dio dio;
  final AuthNotifier _authNotifier;

  ApiClient(this._authNotifier) {
    dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: Duration(milliseconds: AppConfig.requestTimeout),
      receiveTimeout: Duration(milliseconds: AppConfig.requestTimeout),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = _authNotifier.accessToken;
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401 &&
            !(error.requestOptions.extra['_retry'] == true)) {
          error.requestOptions.extra['_retry'] = true;
          final refreshToken = _authNotifier.refreshToken;
          if (refreshToken == null) {
            _authNotifier.clearAuth();
            return handler.reject(error);
          }
          try {
            final response = await Dio().post(
              '${AppConfig.apiBaseUrl}/auth/refresh',
              options: Options(
                headers: {'Authorization': 'Bearer $refreshToken'},
              ),
            );
            final data = response.data['data'];
            final newAccessToken = data['accessToken'] as String;
            final newRefreshToken = data['refreshToken'] as String?;
            _authNotifier.updateTokens(newAccessToken, newRefreshToken);
            error.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
            final retryResponse = await dio.fetch(error.requestOptions);
            return handler.resolve(retryResponse);
          } catch (_) {
            _authNotifier.clearAuth();
            return handler.reject(error);
          }
        }
        handler.reject(error);
      },
    ));
  }
}
