/// Shipment status enum representing the current state of a shipment
enum ShipmentStatus {
  processing,
  pickedUp,
  inTransit,
  customs,
  customsCleared,
  arrivedAtHub,
  outForDelivery,
  delivered,
  exception,
  returned,
  cancelled;

  /// Display name for UI presentation
  String get displayName {
    switch (this) {
      case ShipmentStatus.processing:
        return 'Processing';
      case ShipmentStatus.pickedUp:
        return 'Picked Up';
      case ShipmentStatus.inTransit:
        return 'In Transit';
      case ShipmentStatus.customs:
        return 'At Customs';
      case ShipmentStatus.customsCleared:
        return 'Customs Cleared';
      case ShipmentStatus.arrivedAtHub:
        return 'Arrived at Hub';
      case ShipmentStatus.outForDelivery:
        return 'Out for Delivery';
      case ShipmentStatus.delivered:
        return 'Delivered';
      case ShipmentStatus.exception:
        return 'Exception';
      case ShipmentStatus.returned:
        return 'Returned';
      case ShipmentStatus.cancelled:
        return 'Cancelled';
    }
  }

  /// Convert status name to enum value (for MongoDB deserialization)
  static ShipmentStatus fromString(String status) {
    switch (status.toLowerCase().replaceAll(' ', '').replaceAll('_', '')) {
      case 'processing':
        return ShipmentStatus.processing;
      case 'pickedup':
        return ShipmentStatus.pickedUp;
      case 'intransit':
        return ShipmentStatus.inTransit;
      case 'customs':
        return ShipmentStatus.customs;
      case 'customscleared':
        return ShipmentStatus.customsCleared;
      case 'arrivedathub':
        return ShipmentStatus.arrivedAtHub;
      case 'outfordelivery':
        return ShipmentStatus.outForDelivery;
      case 'delivered':
        return ShipmentStatus.delivered;
      case 'exception':
        return ShipmentStatus.exception;
      case 'returned':
        return ShipmentStatus.returned;
      case 'cancelled':
        return ShipmentStatus.cancelled;
      // Legacy status mappings
      case 'pending':
        return ShipmentStatus.processing;
      default:
        return ShipmentStatus.processing;
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
  /// Expected JSON structure from MongoDB (new format):
  /// ```json
  /// {
  ///   "_id": "...",
  ///   "trackingNumber": "TRK-...",
  ///   "origin": {"city": "Shanghai", "country": "China", "code": "PVG"},
  ///   "destination": {"city": "New York", "country": "USA", "code": "JFK"},
  ///   "status": "In Transit",
  ///   "estimatedDelivery": "2026-01-15T00:00:00.000Z",
  ///   "packageCount": 3
  /// }
  /// ```
  /// Also supports legacy format with origin/destination as strings
  factory Shipment.fromJson(Map<String, dynamic> json) {
    // Handle origin - can be String or Object
    String originStr;
    if (json['origin'] is String) {
      originStr = json['origin'] as String;
    } else if (json['origin'] is Map) {
      final originMap = json['origin'] as Map<String, dynamic>;
      originStr = '${originMap['city'] ?? ''}, ${originMap['country'] ?? ''}';
    } else {
      originStr = 'Unknown';
    }

    // Handle destination - can be String or Object
    String destinationStr;
    if (json['destination'] is String) {
      destinationStr = json['destination'] as String;
    } else if (json['destination'] is Map) {
      final destMap = json['destination'] as Map<String, dynamic>;
      destinationStr = '${destMap['city'] ?? ''}, ${destMap['country'] ?? ''}';
    } else {
      destinationStr = 'Unknown';
    }

    // Handle estimatedDelivery - can be null
    DateTime estimatedDelivery;
    if (json['estimatedDelivery'] != null) {
      estimatedDelivery = DateTime.parse(json['estimatedDelivery'] as String);
    } else {
      estimatedDelivery = DateTime.now().add(const Duration(days: 7));
    }

    return Shipment(
      // MongoDB uses _id, but API might normalize to id
      id: (json['_id'] ?? json['id'] ?? '') as String,
      trackingNumber: (json['trackingNumber'] ?? '') as String,
      origin: originStr,
      destination: destinationStr,
      status: (json['status'] ?? 'Processing') as String,
      estimatedDelivery: estimatedDelivery,
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
