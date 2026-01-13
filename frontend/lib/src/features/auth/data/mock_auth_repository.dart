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

  Future<void> signIn(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      // Simulate network delay
      await Future.delayed(const Duration(seconds: 1));

      // Check specific credentials
      if (email == 'test@gmail.com' && password == 'qwerty') {
        const user = User(
          id: 'user_123',
          email: 'test@gmail.com',
          fullName: 'Test User',
          phone: '+1 234 567 8900',
          country: 'United States',
        );
        await _saveUser(user);
        return user;
      } else {
        throw Exception('Invalid email or password');
      }
    });
  }

  Future<void> signUp({
    required String fullName,
    required String email,
    required String phone,
    required String country,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await Future.delayed(const Duration(seconds: 1));
      final user = User(
        id: 'user_${DateTime.now().millisecondsSinceEpoch}',
        email: email,
        fullName: fullName,
        phone: phone,
        country: country,
      );
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
