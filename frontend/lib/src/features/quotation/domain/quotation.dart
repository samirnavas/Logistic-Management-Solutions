/// Quotation status enum
enum QuotationStatus {
  pending,
  approved,
  rejected,
  readyForPickup;

  String get displayName {
    switch (this) {
      case QuotationStatus.pending:
        return 'Pending';
      case QuotationStatus.approved:
        return 'Approved';
      case QuotationStatus.rejected:
        return 'Rejected';
      case QuotationStatus.readyForPickup:
        return 'Ready For Pickup';
    }
  }
}

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
    if (status == null) return QuotationStatus.pending;

    switch (status) {
      case 'Draft':
      case 'Pending':
      case 'Pending Approval':
        return QuotationStatus.pending;
      case 'Approved':
      case 'Sent':
      case 'Accepted':
        return QuotationStatus.approved;
      case 'Rejected':
      case 'Cancelled':
      case 'Expired':
        return QuotationStatus.rejected;
      case 'Ready for Pickup':
        return QuotationStatus.readyForPickup;
      default:
        return QuotationStatus.pending;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      // 'requestId': requestId,
      'createdDate': createdDate.toIso8601String(),
      'totalAmount': totalAmount,
      'status': status.name,
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
