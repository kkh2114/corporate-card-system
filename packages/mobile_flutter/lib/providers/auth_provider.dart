import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../api/auth_api.dart';
import '../api/api_client.dart';

class AuthNotifier extends ChangeNotifier {
  User? _user;
  String? _accessToken;
  String? _refreshToken;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  bool get isAuthenticated => _accessToken != null && _user != null;
  bool get isLoading => _isLoading;
  String? get error => _error;

  late final ApiClient _apiClient;
  late final AuthApi _authApi;

  AuthNotifier() {
    _apiClient = ApiClient(this);
    _authApi = AuthApi(_apiClient.dio);
  }

  ApiClient get apiClient => _apiClient;

  Future<void> loadFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('accessToken');
    _refreshToken = prefs.getString('refreshToken');
    final userStr = prefs.getString('user');
    if (_accessToken != null && _refreshToken != null && userStr != null) {
      _user = User.fromJson(jsonDecode(userStr));
    }
    notifyListeners();
  }

  Future<void> login(String employeeId, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _authApi.login(employeeId, password);
      _user = User.fromJson(data['user']);
      _accessToken = data['accessToken'] as String;
      _refreshToken = data['refreshToken'] as String;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', _accessToken!);
      await prefs.setString('refreshToken', _refreshToken!);
      await prefs.setString('user', jsonEncode(_user!.toJson()));
    } catch (e) {
      _error = '로그인에 실패했습니다. 다시 시도해주세요.';
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void updateToken(String newToken) {
    _accessToken = newToken;
    SharedPreferences.getInstance().then((p) => p.setString('accessToken', newToken));
    notifyListeners();
  }

  void updateTokens(String newAccessToken, String? newRefreshToken) {
    _accessToken = newAccessToken;
    if (newRefreshToken != null) _refreshToken = newRefreshToken;
    SharedPreferences.getInstance().then((p) {
      p.setString('accessToken', newAccessToken);
      if (newRefreshToken != null) p.setString('refreshToken', newRefreshToken);
    });
    notifyListeners();
  }

  Future<void> clearAuth() async {
    _user = null;
    _accessToken = null;
    _refreshToken = null;
    _error = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('user');
    notifyListeners();
  }

  Future<void> logout() async {
    await clearAuth();
  }
}
