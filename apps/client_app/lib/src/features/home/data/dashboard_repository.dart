import 'package:bb_logistics/src/core/api/api_service.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:bb_logistics/src/features/home/domain/dashboard_stats.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'dashboard_repository.g.dart';

class DashboardRepository {
  final ApiService _apiService;
  final String? _currentUserId;

  DashboardRepository(this._apiService, this._currentUserId);

  Future<DashboardStats> getStats() async {
    if (_currentUserId == null) {
      return DashboardStats(
        requests: 0,
        shipped: 0,
        delivered: 0,
        cleared: 0,
        dispatch: 0,
        waiting: 0,
      );
    }

    try {
      final response = await _apiService.getRequest(
        '/api/users/$_currentUserId/dashboard-stats',
      );
      return DashboardStats.fromJson(response);
    } catch (e) {
      // In case of error (or offline), return zeros or handle gracefully
      // For now, rethrow or return empty to allow UI to show error/empty
      rethrow;
    }
  }
}

@riverpod
DashboardRepository dashboardRepository(Ref ref) {
  final authState = ref.watch(authRepositoryProvider);
  final userId = authState.value?.id;
  return DashboardRepository(ApiService(), userId);
}

@riverpod
Future<DashboardStats> dashboardStats(Ref ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return repository.getStats();
}
