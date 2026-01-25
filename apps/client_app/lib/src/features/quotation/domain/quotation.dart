/// Quotation status enum
enum QuotationStatus {
  requestSent,
  costCalculated,
  rejected,
  readyForPickup,
  shipped,
  delivered;

  String get displayName {
    switch (this) {
      case QuotationStatus.requestSent:
        return 'Request Sent';
      case QuotationStatus.costCalculated:
        return 'Cost Calculated';
      case QuotationStatus.rejected:
        return 'Rejected';
      case QuotationStatus.readyForPickup:
        return 'Ready For Pickup';
      case QuotationStatus.shipped:
        return 'Shipped';
      case QuotationStatus.delivered:
        return 'Delivered';
    }
  }
}

// ... (QuotationItem and QuotationAddress classes remain the same)

/// Represents a single line item in a quotation
class QuotationItem {
  final String description;
  final double cost;

  const QuotationItem({required this.description, required this.cost});

  QuotationItem copyWith({String? description, double? cost}) {
    return QuotationItem(
      description: description ?? this.description,
      cost: cost ?? this.cost,
    );
  }

  factory QuotationItem.fromJson(Map<String, dynamic> json) {
    return QuotationItem(
      description: json['description'] as String,
      // Backend uses 'amount' for the total cost of the line item
      cost: (json['amount'] ?? json['unitPrice'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'description': description, 'cost': cost};
  }
}

/// Represents a quotation for a shipment request
/// Represents an address in the quotation
class QuotationAddress {
  final String name;
  final String phone;
  final String addressLine;
  final String city;
  final String state;
  final String country;
  final String zip;

  const QuotationAddress({
    required this.name,
    required this.phone,
    required this.addressLine,
    required this.city,
    required this.state,
    required this.country,
    required this.zip,
  });

  factory QuotationAddress.fromJson(Map<String, dynamic> json) {
    return QuotationAddress(
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      addressLine: json['addressLine'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      country: json['country'] as String? ?? '',
      zip: json['zip'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'addressLine': addressLine,
      'city': city,
      'state': state,
      'country': country,
      'zip': zip,
    };
  }
}

/// Represents a quotation for a shipment request
class Quotation {
  final String id;
  final String? quotationId;
  // final String requestId; // Removed in backend
  final DateTime createdDate;
  final double totalAmount;
  final QuotationStatus status;
  final String? pdfUrl;
  final List<QuotationItem> items;

  // New Fields
  final QuotationAddress? origin;
  final QuotationAddress? destination;
  final DateTime? pickupDate;
  final DateTime? deliveryDate;
  final String? cargoType;
  final String? serviceType;
  final String? specialInstructions;

  const Quotation({
    required this.id,
    this.quotationId,
    // required this.requestId,
    required this.createdDate,
    required this.totalAmount,
    required this.status,
    this.pdfUrl,
    required this.items,
    this.origin,
    this.destination,
    this.pickupDate,
    this.deliveryDate,
    this.cargoType,
    this.serviceType,
    this.specialInstructions,
  });

  Quotation copyWith({
    String? id,
    String? quotationId,
    // String? requestId,
    DateTime? createdDate,
    double? totalAmount,
    QuotationStatus? status,
    String? pdfUrl,
    List<QuotationItem>? items,
    QuotationAddress? origin,
    QuotationAddress? destination,
    DateTime? pickupDate,
    DateTime? deliveryDate,
    String? cargoType,
    String? serviceType,
    String? specialInstructions,
  }) {
    return Quotation(
      id: id ?? this.id,
      quotationId: quotationId ?? this.quotationId,
      // requestId: requestId ?? this.requestId,
      createdDate: createdDate ?? this.createdDate,
      totalAmount: totalAmount ?? this.totalAmount,
      status: status ?? this.status,
      pdfUrl: pdfUrl ?? this.pdfUrl,
      items: items ?? this.items,
      origin: origin ?? this.origin,
      destination: destination ?? this.destination,
      pickupDate: pickupDate ?? this.pickupDate,
      deliveryDate: deliveryDate ?? this.deliveryDate,
      cargoType: cargoType ?? this.cargoType,
      serviceType: serviceType ?? this.serviceType,
      specialInstructions: specialInstructions ?? this.specialInstructions,
    );
  }

  factory Quotation.fromJson(Map<String, dynamic> json) {
    return Quotation(
      id: json['id'] as String,
      quotationId: json['quotationId'] as String?,
      // requestId: '', // Deprecated
      createdDate: DateTime.parse(
        json['createdAt'] ??
            json['createdDate'] ??
            DateTime.now().toIso8601String(),
      ),
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      status: _parseStatus(json['status']),
      pdfUrl: json['pdfUrl'] as String?,
      items:
          (json['items'] as List<dynamic>?)
              ?.map(
                (item) => QuotationItem.fromJson(item as Map<String, dynamic>),
              )
              .toList() ??
          [],
      origin: json['origin'] != null
          ? QuotationAddress.fromJson(json['origin'])
          : null,
      destination: json['destination'] != null
          ? QuotationAddress.fromJson(json['destination'])
          : null,
      pickupDate: json['pickupDate'] != null
          ? DateTime.tryParse(json['pickupDate'])
          : null,
      deliveryDate: json['deliveryDate'] != null
          ? DateTime.tryParse(json['deliveryDate'])
          : null,
      cargoType: json['cargoType'] as String?,
      serviceType: json['serviceType'] as String?,
      specialInstructions: json['specialInstructions'] as String?,
    );
  }

  static QuotationStatus _parseStatus(String? status) {
    if (status == null) return QuotationStatus.requestSent;

    switch (status) {
      case 'request_sent':
      case 'Pending': // Legacy
        return QuotationStatus.requestSent;
      case 'cost_calculated':
      case 'Approved': // Legacy
        return QuotationStatus.costCalculated;
      case 'rejected':
      case 'Rejected': // Legacy
        return QuotationStatus.rejected;
      case 'ready_for_pickup':
      case 'Ready for Pickup': // Legacy
        return QuotationStatus.readyForPickup;
      case 'shipped':
        return QuotationStatus.shipped;
      case 'delivered':
        return QuotationStatus.delivered;
      default:
        return QuotationStatus.requestSent;
    }
  }

  Map<String, dynamic> toJson() {
    String statusStr;
    switch (status) {
      case QuotationStatus.requestSent:
        statusStr = 'request_sent';
        break;
      case QuotationStatus.costCalculated:
        statusStr = 'cost_calculated';
        break;
      case QuotationStatus.rejected:
        statusStr = 'rejected';
        break;
      case QuotationStatus.readyForPickup:
        statusStr = 'ready_for_pickup';
        break;
      case QuotationStatus.shipped:
        statusStr = 'shipped';
        break;
      case QuotationStatus.delivered:
        statusStr = 'delivered';
        break;
    }

    return {
      'id': id,
      'quotationId': quotationId,
      // 'requestId': requestId,
      'createdDate': createdDate.toIso8601String(),
      'totalAmount': totalAmount,
      'status': statusStr,
      'pdfUrl': pdfUrl,
      'items': items.map((item) => item.toJson()).toList(),
      'origin': origin?.toJson(),
      'destination': destination?.toJson(),
      'pickupDate': pickupDate?.toIso8601String(),
      'deliveryDate': deliveryDate?.toIso8601String(),
      'cargoType': cargoType,
      'serviceType': serviceType,
      'specialInstructions': specialInstructions,
    };
  }
}
