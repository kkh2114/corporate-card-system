import 'package:dio/dio.dart';

class AuthApi {
  final Dio dio;

  AuthApi(this.dio);

  Future<Map<String, dynamic>> login(String employeeId, String password) async {
    final response = await dio.post('/auth/login', data: {
      'employeeId': employeeId,
      'password': password,
    });
    final data = response.data['data'] as Map<String, dynamic>;
    return data;
  }

  Future<String> refresh(String refreshToken) async {
    final response = await dio.post(
      '/auth/refresh',
      options: Options(
        headers: {'Authorization': 'Bearer $refreshToken'},
      ),
    );
    return response.data['data']['accessToken'] as String;
  }
}
