import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:bb_logistics/src/core/api/api_service.dart';
import '../domain/warehouse.dart';

class WarehouseRepository {
  final ApiService _apiService;

  WarehouseRepository(this._apiService);

  Future<List<Warehouse>> getWarehouses() async {
    try {
      final response = await _apiService.getRequest('/api/warehouses');

      if (response is Map<String, dynamic> && response['success'] == true) {
        final List<dynamic> data = response['data'];
        return data.map((json) => Warehouse.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch warehouses: $e');
    }
  }
}

final warehouseRepositoryProvider = Provider<WarehouseRepository>((ref) {
  return WarehouseRepository(ApiService());
});

final warehousesProvider = FutureProvider<List<Warehouse>>((ref) async {
  final repository = ref.watch(warehouseRepositoryProvider);
  return repository.getWarehouses();
});
