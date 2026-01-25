import 'package:bb_logistics/src/core/api/api_service.dart';
import 'package:bb_logistics/src/features/address/domain/address.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'address_repository.g.dart';

@riverpod
class AddressRepository extends _$AddressRepository {
  final _apiService = ApiService();

  @override
  Future<List<Address>> build() async {
    final user = ref.watch(authRepositoryProvider).valueOrNull;
    if (user == null) {
      return [];
    }

    try {
      final response = await _apiService.getRequest(
        '/api/users/${user.id}/addresses',
      );

      // The API returns { addresses: [...], defaultAddress: ... }
      if (response is Map<String, dynamic> &&
          response.containsKey('addresses')) {
        return (response['addresses'] as List)
            .map((e) => Address.fromJson(e))
            .toList();
      }
      return [];
    } catch (e) {
      // Return empty list on error for now, or rethrow if you want error UI
      return [];
    }
  }

  Future<void> addAddress(Address address) async {
    final user = ref.read(authRepositoryProvider).valueOrNull;
    if (user == null) return;

    // Save previous state
    final previousState = state.value;
    // Optimistic update
    state = AsyncValue.data([...previousState ?? [], address]);

    try {
      await _apiService.postRequest(
        '/api/users/${user.id}/addresses',
        address.toJson(),
      );
      // Refresh to get server ID and confirmation
      ref.invalidateSelf();
    } catch (e) {
      // Revert on failure
      state = AsyncValue.data(previousState ?? []);
      rethrow;
    }
  }

  Future<void> deleteAddress(String addressId) async {
    final user = ref.read(authRepositoryProvider).valueOrNull;
    if (user == null) return;

    final previousState = state.value;
    state = AsyncValue.data(
      (previousState ?? []).where((a) => a.id != addressId).toList(),
    );

    try {
      await _apiService.deleteRequest(
        '/api/users/${user.id}/addresses/$addressId',
      );
      // No need to invalidate if successful, our local state is correct (minus the ID check)
      // But safe to invalidate to sync.
    } catch (e) {
      state = AsyncValue.data(previousState ?? []);
      rethrow;
    }
  }

  Future<void> updateAddress(Address address) async {
    final user = ref.read(authRepositoryProvider).valueOrNull;
    if (user == null) return;

    final previousState = state.value;
    // Optimistic update
    state = AsyncValue.data(
      (previousState ?? [])
          .map((a) => a.id == address.id ? address : a)
          .toList(),
    );

    try {
      await _apiService.putRequest(
        '/api/users/${user.id}/addresses/${address.id}',
        address.toJson(),
      );
      // Refresh to get server confirmation
      ref.invalidateSelf();
    } catch (e) {
      state = AsyncValue.data(previousState ?? []);
      rethrow;
    }
  }
}
