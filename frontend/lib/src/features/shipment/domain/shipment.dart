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

  /// Created date and time
  final DateTime createdAt;

  /// List of associated package IDs
  final List<String> packageIds;

  /// Customer Name (from clientId)
  final String customerName;

  /// Shipping Cost
  final double cost;

  /// Package Count
  final int packageCount;

  /// Total Weight
  final double totalWeight;

  /// Current Latitude
  final double? currentLat;

  /// Current Longitude
  final double? currentLng;

  /// Destination Latitude
  final double? destLat;

  /// Destination Longitude
  final double? destLng;

  /// Shipment Mode (Air, Sea, etc.)
  final String mode;

  const Shipment({
    required this.id,
    required this.trackingNumber,
    required this.origin,
    required this.destination,
    required this.status,
    required this.estimatedDelivery,
    required this.packageIds,
    this.customerName = 'Unknown',
    this.cost = 0.0,
    this.packageCount = 1,
    this.totalWeight = 0.0,
    required this.createdAt,
    this.currentLat,
    this.currentLng,
    this.destLat,
    this.destLng,
    this.mode = 'Air',
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
    String? customerName,
    double? cost,
    int? packageCount,
    double? totalWeight,
    DateTime? createdAt,
    double? currentLat,
    double? currentLng,
    double? destLat,
    double? destLng,
    String? mode,
  }) {
    return Shipment(
      id: id ?? this.id,
      trackingNumber: trackingNumber ?? this.trackingNumber,
      origin: origin ?? this.origin,
      destination: destination ?? this.destination,
      status: status ?? this.status,
      estimatedDelivery: estimatedDelivery ?? this.estimatedDelivery,
      packageIds: packageIds ?? this.packageIds,
      customerName: customerName ?? this.customerName,
      cost: cost ?? this.cost,
      packageCount: packageCount ?? this.packageCount,
      totalWeight: totalWeight ?? this.totalWeight,
      createdAt: createdAt ?? this.createdAt,
      currentLat: currentLat ?? this.currentLat,
      currentLng: currentLng ?? this.currentLng,
      destLat: destLat ?? this.destLat,
      destLng: destLng ?? this.destLng,
      mode: mode ?? this.mode,
    );
  }

  /// Creates a [Shipment] from a JSON map (MongoDB document)
  factory Shipment.fromJson(Map<String, dynamic> json) {
    // Handle origin
    String originStr;
    if (json['origin'] is String) {
      originStr = json['origin'] as String;
    } else if (json['origin'] is Map) {
      final originMap = json['origin'] as Map<String, dynamic>;
      originStr = '${originMap['city'] ?? ''}, ${originMap['country'] ?? ''}';
    } else {
      originStr = 'Unknown';
    }

    // Handle destination
    String destinationStr;
    double? dLat;
    double? dLng;
    if (json['destination'] is String) {
      destinationStr = json['destination'] as String;
    } else if (json['destination'] is Map) {
      final destMap = json['destination'] as Map<String, dynamic>;
      destinationStr = '${destMap['city'] ?? ''}, ${destMap['country'] ?? ''}';

      // Parse coordinates if available
      if (destMap['coordinates'] is Map) {
        dLat = (destMap['coordinates']['latitude'] as num?)?.toDouble();
        dLng = (destMap['coordinates']['longitude'] as num?)?.toDouble();
      }
    } else {
      destinationStr = 'Unknown';
    }

    // Handle estimatedDelivery
    DateTime estimatedDelivery;
    if (json['estimatedDelivery'] != null) {
      estimatedDelivery = DateTime.parse(json['estimatedDelivery'] as String);
    } else {
      estimatedDelivery = DateTime.now().add(const Duration(days: 7));
    }

    // Handle createdAt
    DateTime createdAt;
    if (json['createdAt'] != null) {
      createdAt = DateTime.parse(json['createdAt'] as String);
    } else {
      createdAt = DateTime.now();
    }

    // Handle customerName
    String customerName = 'Unknown';
    if (json['clientId'] is Map) {
      customerName = json['clientId']['fullName'] ?? 'Unknown';
    }

    // Handle current location
    double? lat;
    double? lng;
    if (json['currentLocation'] is Map) {
      final loc = json['currentLocation'] as Map<String, dynamic>;
      if (loc['coordinates'] is Map) {
        lat = (loc['coordinates']['latitude'] as num?)?.toDouble();
        lng = (loc['coordinates']['longitude'] as num?)?.toDouble();
      }
    }

    return Shipment(
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
      customerName: customerName,
      cost: (json['shippingCost'] as num?)?.toDouble() ?? 0.0,
      packageCount: (json['packageCount'] as num?)?.toInt() ?? 1,
      totalWeight: (json['totalWeight'] as num?)?.toDouble() ?? 0.0,
      createdAt: createdAt,
      currentLat: lat,
      currentLng: lng,
      destLat: dLat,
      destLng: dLng,
      mode: (json['mode'] ?? 'Air') as String,
    );
  }

  /// Converts this [Shipment] to a JSON map for API requests
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'trackingNumber': trackingNumber,
      'origin': origin,
      'destination': destination,
      'status': status,
      'estimatedDelivery': estimatedDelivery.toIso8601String(),
      'packageIds': packageIds,
      'customerName': customerName,
      'shippingCost': cost,
      'packageCount': packageCount,
      'totalWeight': totalWeight,
      'createdAt': createdAt.toIso8601String(),
      'mode': mode,
    };
  }

  /// Returns the [ShipmentStatus] enum from the status string
  ShipmentStatus get statusEnum => ShipmentStatus.fromString(status);

  @override
  String toString() {
    return 'Shipment(id: $id, trackingNumber: $trackingNumber, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Shipment && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
