/// Shipment status enum representing the current state of a shipment
enum ShipmentStatus {
  pending,
  inTransit,
  delivered;

  /// Display name for UI presentation
  String get displayName {
    switch (this) {
      case ShipmentStatus.pending:
        return 'Pending';
      case ShipmentStatus.inTransit:
        return 'In Transit';
      case ShipmentStatus.delivered:
        return 'Delivered';
    }
  }

  /// Convert status name to enum value (for MongoDB deserialization)
  static ShipmentStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return ShipmentStatus.pending;
      case 'in transit':
      case 'intransit':
      case 'in_transit':
        return ShipmentStatus.inTransit;
      case 'delivered':
        return ShipmentStatus.delivered;
      default:
        return ShipmentStatus.pending;
    }
  }
}

/// Represents a shipment entity matching the MongoDB schema
///
/// This model is designed to map directly to MongoDB documents:
/// - [id] maps to MongoDB `_id`
/// - [trackingNumber] is a unique identifier for tracking
/// - [origin] and [destination] represent shipping locations
/// - [status] represents the current shipment state
/// - [estimatedDelivery] is the expected delivery date
/// - [packageIds] contains references to associated package documents
class Shipment {
  /// Unique identifier (maps to MongoDB _id)
  final String id;

  /// Unique tracking number for the shipment
  final String trackingNumber;

  /// Origin location/address
  final String origin;

  /// Destination location/address
  final String destination;

  /// Current status of the shipment
  final String status;

  /// Estimated delivery date and time
  final DateTime estimatedDelivery;

  /// List of associated package IDs
  final List<String> packageIds;

  const Shipment({
    required this.id,
    required this.trackingNumber,
    required this.origin,
    required this.destination,
    required this.status,
    required this.estimatedDelivery,
    required this.packageIds,
  });

  /// Creates a copy of this [Shipment] with the given fields replaced
  Shipment copyWith({
    String? id,
    String? trackingNumber,
    String? origin,
    String? destination,
    String? status,
    DateTime? estimatedDelivery,
    List<String>? packageIds,
  }) {
    return Shipment(
      id: id ?? this.id,
      trackingNumber: trackingNumber ?? this.trackingNumber,
      origin: origin ?? this.origin,
      destination: destination ?? this.destination,
      status: status ?? this.status,
      estimatedDelivery: estimatedDelivery ?? this.estimatedDelivery,
      packageIds: packageIds ?? this.packageIds,
    );
  }

  /// Creates a [Shipment] from a JSON map (MongoDB document)
  ///
  /// Expected JSON structure from MongoDB:
  /// ```json
  /// {
  ///   "_id": "...",
  ///   "trackingNumber": "TRK-...",
  ///   "origin": "City, Country",
  ///   "destination": "City, Country",
  ///   "status": "Pending|In Transit|Delivered",
  ///   "estimatedDelivery": "2026-01-15T00:00:00.000Z",
  ///   "packageIds": ["pkg1", "pkg2"]
  /// }
  /// ```
  factory Shipment.fromJson(Map<String, dynamic> json) {
    return Shipment(
      // MongoDB uses _id, but API might normalize to id
      id: (json['_id'] ?? json['id']) as String,
      trackingNumber: json['trackingNumber'] as String,
      origin: json['origin'] as String,
      destination: json['destination'] as String,
      status: json['status'] as String,
      estimatedDelivery: DateTime.parse(json['estimatedDelivery'] as String),
      packageIds:
          (json['packageIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  /// Converts this [Shipment] to a JSON map for API requests
  ///
  /// Note: Uses `id` key for consistency with REST APIs.
  /// The backend should handle mapping to MongoDB's `_id`.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'trackingNumber': trackingNumber,
      'origin': origin,
      'destination': destination,
      'status': status,
      'estimatedDelivery': estimatedDelivery.toIso8601String(),
      'packageIds': packageIds,
    };
  }

  /// Returns the [ShipmentStatus] enum from the status string
  ShipmentStatus get statusEnum => ShipmentStatus.fromString(status);

  @override
  String toString() {
    return 'Shipment(id: $id, trackingNumber: $trackingNumber, origin: $origin, '
        'destination: $destination, status: $status, '
        'estimatedDelivery: $estimatedDelivery, packageIds: $packageIds)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Shipment && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
