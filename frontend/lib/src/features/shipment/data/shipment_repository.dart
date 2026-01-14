import '../domain/shipment.dart';

/// Abstract repository interface for shipment data operations.
///
/// This interface defines the contract for shipment data access,
/// following the Repository Pattern to separate data access logic
/// from business logic.
///
/// Implementations:
/// - [MockShipmentRepository] - Local mock data for development/testing
/// - Future: `ApiShipmentRepository` - REST API integration with Node.js backend
/// - Future: `MongoShipmentRepository` - Direct MongoDB integration
abstract class ShipmentRepository {
  /// Retrieves all shipments.
  ///
  /// Returns a list of all available [Shipment] objects.
  /// This may include pagination in future implementations.
  ///
  /// Throws an exception if the data cannot be retrieved.
  Future<List<Shipment>> getShipments();

  /// Retrieves all shipments for a specific client.
  Future<List<Shipment>> getShipmentsByClient(String clientId);

  /// Retrieves a single shipment by its unique identifier.
  ///
  /// [id] - The unique shipment ID (maps to MongoDB `_id`)
  ///
  /// Returns the [Shipment] if found.
  /// Throws an exception if the shipment is not found or on error.
  Future<Shipment> getShipment(String id);

  /// Creates a new shipment.
  ///
  /// [shipmentData] - A map containing the shipment data.
  /// Expected keys match the [Shipment.fromJson] requirements:
  /// - `trackingNumber` (String)
  /// - `origin` (String)
  /// - `destination` (String)
  /// - `status` (String, optional - defaults to 'Pending')
  /// - `estimatedDelivery` (String, ISO 8601 format)
  /// - `packageIds` (List<String>, optional)
  ///
  /// Throws an exception if creation fails.
  Future<void> createShipment(Map<String, dynamic> shipmentData);

  /// Retrieves a shipment by its tracking number.
  ///
  /// [trackingNumber] - The unique tracking number
  ///
  /// Returns the [Shipment] if found.
  /// Throws an exception if the shipment is not found or on error.
  Future<Shipment> getShipmentByTrackingNumber(String trackingNumber);

  /// Updates an existing shipment.
  ///
  /// [id] - The unique shipment ID
  /// [shipmentData] - A map containing the fields to update
  ///
  /// Throws an exception if the update fails.
  Future<void> updateShipment(String id, Map<String, dynamic> shipmentData);

  /// Deletes a shipment by its unique identifier.
  ///
  /// [id] - The unique shipment ID
  ///
  /// Throws an exception if deletion fails.
  Future<void> deleteShipment(String id);

  /// Retrieves shipments filtered by status.
  ///
  /// [status] - The status to filter by (e.g., 'Pending', 'In Transit', 'Delivered')
  ///
  /// Returns a list of [Shipment] objects matching the status.
  Future<List<Shipment>> getShipmentsByStatus(String status);

  /// Creates a new shipment request.
  Future<void> createShipmentRequest(Map<String, dynamic> requestData);
}
