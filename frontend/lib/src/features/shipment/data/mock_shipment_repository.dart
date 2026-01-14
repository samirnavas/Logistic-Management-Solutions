import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../auth/data/auth_repository.dart';
import '../domain/shipment.dart';
import 'shipment_repository.dart';

import 'api_shipment_repository.dart';

part 'mock_shipment_repository.g.dart';

// ... (MockShipmentRepository class definition kept for reference/fallback if needed)

@riverpod
ShipmentRepository shipmentRepository(Ref ref) {
  return ApiShipmentRepository();
}

/// Fetches the list of all shipments.
///
/// Usage in widgets:
/// ```dart
/// final shipmentsAsync = ref.watch(shipmentListProvider);
/// shipmentsAsync.when(
///   data: (shipments) => ListView(...),
///   loading: () => CircularProgressIndicator(),
///   error: (e, st) => Text('Error: $e'),
/// );
/// ```
@riverpod
Future<List<Shipment>> shipmentList(Ref ref) async {
  final repository = ref.watch(shipmentRepositoryProvider);
  final authState = ref.watch(authRepositoryProvider);
  final user = authState.valueOrNull;

  if (user != null) {
    return repository.getShipmentsByClient(user.id);
  } else {
    // Return empty list if no user is logged in
    return [];
  }
}

/// Fetches a single shipment by ID.
///
/// Usage:
/// ```dart
/// final shipmentAsync = ref.watch(shipmentByIdProvider('SHP-2026-001'));
/// ```
@riverpod
Future<Shipment> shipmentById(Ref ref, String id) async {
  final repository = ref.watch(shipmentRepositoryProvider);
  return repository.getShipment(id);
}

/// Fetches a shipment by tracking number.
@riverpod
Future<Shipment> shipmentByTracking(Ref ref, String trackingNumber) async {
  final repository = ref.watch(shipmentRepositoryProvider);
  return repository.getShipmentByTrackingNumber(trackingNumber);
}

/// Fetches shipments filtered by status.
@riverpod
Future<List<Shipment>> shipmentsByStatus(Ref ref, String status) async {
  final repository = ref.watch(shipmentRepositoryProvider);
  return repository.getShipmentsByStatus(status);
}
