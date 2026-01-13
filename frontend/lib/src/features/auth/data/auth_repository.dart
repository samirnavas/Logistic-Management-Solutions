import 'package:bb_logistics/src/core/api/api_service.dart';
import 'package:bb_logistics/src/features/auth/domain/user.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'auth_repository.g.dart';

@Riverpod(keepAlive: true)
AuthRepository authRepository(Ref ref) {
  return AuthRepository(ApiService());
}

class AuthRepository {
  final ApiService _apiService;

  AuthRepository(this._apiService);

  Future<User> login(String email, String password) async {
    final response = await _apiService.postRequest('/api/auth/login', {
      'email': email,
      'password': password,
    });
    return _parseUser(response);
  }

  Future<User> register({
    required String fullName,
    required String email,
    required String password,
    required String phone,
    required String country,
  }) async {
    final response = await _apiService.postRequest('/api/auth/register', {
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'country': country,
      'password': password,
    });
    return _parseUser(response);
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
