import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'mock_auth_repository.g.dart';

@Riverpod(keepAlive: true)
class MockAuthRepository extends _$MockAuthRepository {
  @override
  bool build() {
    return true; // Default to true (logged in) for development
  }

  Future<void> signIn(String email, String password) async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));
    state = true;
  }

  Future<void> signUp({
    required String fullName,
    required String email,
    required String phone,
    required String country,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
    state = true;
  }

  Future<void> signOut() async {
    state = false;
  }
}
