import 'package:bb_logistics/src/core/api/api_service.dart';
import 'package:bb_logistics/src/features/auth/domain/user.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'mock_auth_repository.g.dart';

@Riverpod(keepAlive: true)
class MockAuthRepository extends _$MockAuthRepository {
  static const _userKey = 'auth_user';

  @override
  Future<User?> build() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_userKey);
    if (userJson != null) {
      return User.fromJson(userJson);
    }
    return null;
  }

  final _apiService = ApiService();

  Future<void> signIn(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final response = await _apiService.postRequest('/api/auth/login', {
        'email': email,
        'password': password,
      });

      final userData =
          response is Map<String, dynamic> && response.containsKey('user')
          ? response['user']
          : response;

      // Handle Mongoose _id to id mapping if necessary
      if (userData is Map<String, dynamic> && userData.containsKey('_id')) {
        userData['id'] = userData['_id'];
      }

      final user = User.fromMap(userData);
      await _saveUser(user);
      return user;
    });
  }

  Future<void> signUp({
    required String fullName,
    required String email,
    required String phone,
    required String country,
    required String password,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final response = await _apiService.postRequest('/api/auth/register', {
        'fullName': fullName,
        'email': email,
        'phone': phone,
        'country': country,
        'password': password,
      });

      final userData =
          response is Map<String, dynamic> && response.containsKey('user')
          ? response['user']
          : response;

      if (userData is Map<String, dynamic> && userData.containsKey('_id')) {
        userData['id'] = userData['_id'];
      }

      final user = User.fromMap(userData);
      await _saveUser(user);
      return user;
    });
  }

  Future<void> signOut() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userKey);
      return null;
    });
  }

  Future<void> _saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, user.toJson());
  }
}
