import 'package:bb_logistics/src/core/api/api_service.dart';
import 'package:bb_logistics/src/features/shipment/domain/shipment.dart';
import 'package:bb_logistics/src/features/shipment/data/shipment_repository.dart';

class ApiShipmentRepository implements ShipmentRepository {
  final ApiService _apiService = ApiService();

  @override
  Future<List<Shipment>> getShipments() async {
    final response = await _apiService.getRequest('/api/shipments');
    return (response as List).map((e) => Shipment.fromJson(e)).toList();
  }

  @override
  Future<Shipment> getShipment(String id) async {
    final response = await _apiService.getRequest('/api/shipments/$id');
    return Shipment.fromJson(response);
  }

  @override
  Future<Shipment> getShipmentByTrackingNumber(String trackingNumber) async {
    final response = await _apiService.getRequest(
      '/api/shipments/tracking/$trackingNumber',
    );
    return Shipment.fromJson(response);
  }

  @override
  Future<List<Shipment>> getShipmentsByStatus(String status) async {
    final response = await _apiService.getRequest(
      '/api/shipments/status/$status',
    );
    return (response as List).map((e) => Shipment.fromJson(e)).toList();
  }

  @override
  Future<void> createShipment(Map<String, dynamic> shipmentData) async {
    await _apiService.postRequest('/api/shipments', shipmentData);
  }

  @override
  Future<void> updateShipment(
    String id,
    Map<String, dynamic> shipmentData,
  ) async {
    // Requires PUT method
    throw UnimplementedError('Update not implemented yet');
  }

  @override
  Future<void> deleteShipment(String id) async {
    // Requires DELETE method
    throw UnimplementedError('Delete not implemented yet');
  }
}
