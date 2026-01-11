import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../domain/shipment.dart';
import 'shipment_repository.dart';

part 'mock_shipment_repository.g.dart';

/// Mock implementation of [ShipmentRepository] for development and testing.
///
/// This repository simulates a real database connection by:
/// - Returning hardcoded shipment data
/// - Adding artificial network delays to test loading states
///
/// Replace with `ApiShipmentRepository` when connecting to Node.js backend.
class MockShipmentRepository implements ShipmentRepository {
  /// Simulated network delay duration
  static const _networkDelay = Duration(seconds: 1);

  @override
  Future<List<Shipment>> getShipments() async {
    // Simulate network latency of a real server
    await Future.delayed(_networkDelay);
    return _mockShipments;
  }

  @override
  Future<Shipment> getShipment(String id) async {
    // Simulate network latency
    await Future.delayed(_networkDelay);

    final shipment = _mockShipments.where((s) => s.id == id).firstOrNull;
    if (shipment == null) {
      throw Exception('Shipment not found: $id');
    }
    return shipment;
  }

  @override
  Future<void> createShipment(Map<String, dynamic> shipmentData) async {
    // Simulate network latency
    await Future.delayed(_networkDelay);

    // In a real implementation, this would send to MongoDB
    // For now, we just simulate a successful creation
    final newShipment = Shipment(
      id: 'SHP-${DateTime.now().millisecondsSinceEpoch}',
      trackingNumber:
          shipmentData['trackingNumber'] ??
          'TRK-${DateTime.now().millisecondsSinceEpoch}',
      origin: shipmentData['origin'] as String,
      destination: shipmentData['destination'] as String,
      status: shipmentData['status'] ?? 'Pending',
      estimatedDelivery: shipmentData['estimatedDelivery'] != null
          ? DateTime.parse(shipmentData['estimatedDelivery'] as String)
          : DateTime.now().add(const Duration(days: 7)),
      packageIds:
          (shipmentData['packageIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );

    // Add to mock list (in-memory only)
    _mockShipments.add(newShipment);
  }

  @override
  Future<Shipment> getShipmentByTrackingNumber(String trackingNumber) async {
    // Simulate network latency
    await Future.delayed(_networkDelay);

    final shipment = _mockShipments
        .where((s) => s.trackingNumber == trackingNumber)
        .firstOrNull;
    if (shipment == null) {
      throw Exception('Shipment not found with tracking: $trackingNumber');
    }
    return shipment;
  }

  @override
  Future<void> updateShipment(
    String id,
    Map<String, dynamic> shipmentData,
  ) async {
    // Simulate network latency
    await Future.delayed(_networkDelay);

    final index = _mockShipments.indexWhere((s) => s.id == id);
    if (index == -1) {
      throw Exception('Shipment not found: $id');
    }

    final existing = _mockShipments[index];
    _mockShipments[index] = existing.copyWith(
      trackingNumber:
          shipmentData['trackingNumber'] as String? ?? existing.trackingNumber,
      origin: shipmentData['origin'] as String? ?? existing.origin,
      destination:
          shipmentData['destination'] as String? ?? existing.destination,
      status: shipmentData['status'] as String? ?? existing.status,
      estimatedDelivery: shipmentData['estimatedDelivery'] != null
          ? DateTime.parse(shipmentData['estimatedDelivery'] as String)
          : existing.estimatedDelivery,
      packageIds:
          (shipmentData['packageIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          existing.packageIds,
    );
  }

  @override
  Future<void> deleteShipment(String id) async {
    // Simulate network latency
    await Future.delayed(_networkDelay);

    final index = _mockShipments.indexWhere((s) => s.id == id);
    if (index == -1) {
      throw Exception('Shipment not found: $id');
    }
    _mockShipments.removeAt(index);
  }

  @override
  Future<List<Shipment>> getShipmentsByStatus(String status) async {
    // Simulate network latency
    await Future.delayed(_networkDelay);

    return _mockShipments
        .where((s) => s.status.toLowerCase() == status.toLowerCase())
        .toList();
  }
}

/// Mock shipment data simulating MongoDB documents
final List<Shipment> _mockShipments = [
  Shipment(
    id: 'SHP-2026-001',
    trackingNumber: 'TRK-BB-78291034',
    origin: 'Shanghai, China',
    destination: 'Los Angeles, USA',
    status: 'In Transit',
    estimatedDelivery: DateTime(2026, 1, 18),
    packageIds: ['PKG-001', 'PKG-002', 'PKG-003'],
  ),
  Shipment(
    id: 'SHP-2026-002',
    trackingNumber: 'TRK-BB-45632187',
    origin: 'Mumbai, India',
    destination: 'Dubai, UAE',
    status: 'Pending',
    estimatedDelivery: DateTime(2026, 1, 25),
    packageIds: ['PKG-004'],
  ),
  Shipment(
    id: 'SHP-2026-003',
    trackingNumber: 'TRK-BB-92817364',
    origin: 'Rotterdam, Netherlands',
    destination: 'New York, USA',
    status: 'In Transit',
    estimatedDelivery: DateTime(2026, 1, 20),
    packageIds: ['PKG-005', 'PKG-006'],
  ),
  Shipment(
    id: 'SHP-2025-089',
    trackingNumber: 'TRK-BB-11293847',
    origin: 'Singapore',
    destination: 'Sydney, Australia',
    status: 'Delivered',
    estimatedDelivery: DateTime(2026, 1, 5),
    packageIds: ['PKG-007', 'PKG-008', 'PKG-009', 'PKG-010'],
  ),
  Shipment(
    id: 'SHP-2025-088',
    trackingNumber: 'TRK-BB-66574839',
    origin: 'Tokyo, Japan',
    destination: 'Vancouver, Canada',
    status: 'In Transit',
    estimatedDelivery: DateTime(2026, 1, 22),
    packageIds: ['PKG-011', 'PKG-012'],
  ),
  Shipment(
    id: 'SHP-2025-087',
    trackingNumber: 'TRK-BB-33948271',
    origin: 'Hamburg, Germany',
    destination: 'Santos, Brazil',
    status: 'Pending',
    estimatedDelivery: DateTime(2026, 2, 1),
    packageIds: ['PKG-013'],
  ),
];

// ============================================================================
// Riverpod Providers
// ============================================================================

/// Provides the [ShipmentRepository] instance.
///
/// This can be overridden in tests or when switching to a real API:
/// ```dart
/// // In production, override with API implementation
/// ref.read(shipmentRepositoryProvider.notifier).state = ApiShipmentRepository();
/// ```
@riverpod
ShipmentRepository shipmentRepository(Ref ref) {
  return MockShipmentRepository();
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
  return repository.getShipments();
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
