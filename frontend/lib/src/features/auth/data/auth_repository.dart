import 'package:bb_logistics/src/core/api/api_service.dart';
import 'package:bb_logistics/src/features/auth/domain/user.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'auth_repository.g.dart';

@Riverpod(keepAlive: true)
class AuthRepository extends _$AuthRepository {
  static const _userKey = 'auth_user';
  static const _tokenKey = 'jwt_token';
  final _apiService = ApiService();
  final _storage = const FlutterSecureStorage();

  @override
  Future<User?> build() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_userKey);
    if (userJson != null) {
      try {
        return User.fromJson(userJson);
      } catch (e) {
        debugPrint('Failed to parse saved user: $e');
        await prefs.remove(_userKey);
        await _storage.delete(key: _tokenKey);
      }
    }
    return null;
  }

  Future<User> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await _apiService.postRequest('/api/auth/login', {
        'email': email,
        'password': password,
      });
      final user = _parseUser(response);
      await _saveUser(user);

      // Save JWT token if present
      if (response is Map<String, dynamic> && response.containsKey('token')) {
        await _storage.write(key: _tokenKey, value: response['token']);
      }

      state = AsyncValue.data(user);
      return user;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<User> register({
    required String fullName,
    required String email,
    required String password,
    required String phone,
    required String country,
    required String location,
  }) async {
    state = const AsyncValue.loading();
    try {
      final response = await _apiService.postRequest('/api/auth/register', {
        'fullName': fullName,
        'email': email,
        'phone': phone,
        'country': country,
        'location': location,
        'password': password,
      });
      final user = _parseUser(response);
      await _saveUser(user);

      // Save JWT token if present
      if (response is Map<String, dynamic> && response.containsKey('token')) {
        await _storage.write(key: _tokenKey, value: response['token']);
      }

      state = AsyncValue.data(user);
      return user;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> signOut() async {
    state = const AsyncValue.loading();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userKey);
      await _storage.delete(key: _tokenKey);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> _saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, user.toJson());
  }

  User _parseUser(dynamic response) {
    // The backend returns { "message": "...", "user": { ... } }
    final userData =
        response is Map<String, dynamic> && response.containsKey('user')
        ? response['user']
        : response;

    if (userData is Map<String, dynamic>) {
      // Map _id to id if needed
      if (userData.containsKey('_id') && !userData.containsKey('id')) {
        userData['id'] = userData['_id'];
      }
      return User.fromMap(userData);
    } else {
      throw Exception('Invalid user data received');
    }
  }
}
