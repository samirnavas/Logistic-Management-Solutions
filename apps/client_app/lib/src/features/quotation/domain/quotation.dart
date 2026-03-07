/// Quotation status enum
enum QuotationStatus {
  draft,
  requestSent,
  approved,
  addressProvided,
  detailsSubmitted,
  costCalculated,
  sent,
  accepted,
  rejected,
  readyForPickup,
  shipped,
  delivered,
  infoRequired;

  String get displayName {
    switch (this) {
      case QuotationStatus.draft:
        return 'Draft';
      case QuotationStatus.requestSent:
        return 'Request Sent';
      case QuotationStatus.approved:
        return 'Approved - Action Required';
      case QuotationStatus.addressProvided:
        return 'Address Provided';
      case QuotationStatus.detailsSubmitted:
        return 'Details Submitted';
      case QuotationStatus.costCalculated:
        return 'Quotation Ready — Action Required';
      case QuotationStatus.sent:
        return 'Quotation Received';
      case QuotationStatus.accepted:
        return 'Accepted';
      case QuotationStatus.rejected:
        return 'Rejected';
      case QuotationStatus.readyForPickup:
        return 'Ready For Pickup';
      case QuotationStatus.shipped:
        return 'Shipped';
      case QuotationStatus.delivered:
        return 'Delivered';

      case QuotationStatus.infoRequired:
        return 'Info Required';
    }
  }
}

// ... (QuotationItem and QuotationAddress classes remain the same)

/// Represents a single line item in a quotation
class QuotationItem {
  final String description;
  final double cost;
  // New Fields
  final int quantity;
  final double weight;
  final dynamic dimensions; // String "LxWxH" or map
  final List<String> images;
  final double? declaredValue; // New field (commercial)
  final double? shippingCharge; // New field (freight)
  final String category;
  final bool isHazardous;
  final String? videoUrl;
  final double? targetRate;
  final double? packingVolume;
  final String priority;

  const QuotationItem({
    required this.description,
    required this.cost,
    this.quantity = 1,
    this.weight = 0.0,
    this.dimensions = '',
    this.images = const [],
    this.declaredValue,
    this.shippingCharge,
    this.category = 'General',
    this.isHazardous = false,
    this.videoUrl,
    this.targetRate,
    this.packingVolume,
    this.priority = 'Standard',
  });

  QuotationItem copyWith({
    String? description,
    double? cost,
    int? quantity,
    double? weight,
    dynamic dimensions,
    List<String>? images,
    double? declaredValue,
    double? shippingCharge,
    String? category,
    bool? isHazardous,
    String? videoUrl,
    double? targetRate,
    double? packingVolume,
    String? priority,
  }) {
    return QuotationItem(
      description: description ?? this.description,
      cost: cost ?? this.cost,
      quantity: quantity ?? this.quantity,
      weight: weight ?? this.weight,
      dimensions: dimensions ?? this.dimensions,
      images: images ?? this.images,
      declaredValue: declaredValue ?? this.declaredValue,
      shippingCharge: shippingCharge ?? this.shippingCharge,
      category: category ?? this.category,
      isHazardous: isHazardous ?? this.isHazardous,
      videoUrl: videoUrl ?? this.videoUrl,
      targetRate: targetRate ?? this.targetRate,
      packingVolume: packingVolume ?? this.packingVolume,
      priority: priority ?? this.priority,
    );
  }

  factory QuotationItem.fromJson(Map<String, dynamic> json) {
    return QuotationItem(
      description: json['description'] as String? ?? '',
      // Backend uses 'amount' for the total cost of the line item
      cost: (json['amount'] ?? json['unitPrice'] ?? 0).toDouble(),
      quantity: json['quantity'] as int? ?? 1,
      weight: (json['weight'] as num?)?.toDouble() ?? 0.0,
      dimensions: json['dimensions'] ?? '',
      images: (json['images'] as List?)?.map((e) => e as String).toList() ?? [],
      declaredValue: (json['declaredValue'] as num?)?.toDouble(),
      shippingCharge: (json['shippingCharge'] as num?)?.toDouble(),
      category: json['category'] as String? ?? 'General',
      isHazardous: json['isHazardous'] as bool? ?? false,
      videoUrl: json['videoUrl'] as String?,
      targetRate: (json['targetRate'] as num?)?.toDouble(),
      packingVolume: (json['packingVolume'] as num?)?.toDouble(),
      priority: json['priority'] as String? ?? 'Standard',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'description': description,
      'cost': cost,
      'amount': cost, // Ensure backend sees amount if needed
      'quantity': quantity,
      'weight': weight,
      'dimensions': dimensions,
      'images': images,
      'declaredValue': declaredValue,
      'shippingCharge': shippingCharge,
      'category': category,
      'isHazardous': isHazardous,
      'videoUrl': videoUrl,
      'targetRate': targetRate,
      'packingVolume': packingVolume,
      'priority': priority,
    };
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
  final String? currency;

  // New Fields
  final QuotationAddress? origin;
  final QuotationAddress? destination;
  final DateTime? pickupDate;
  final DateTime? deliveryDate;
  final String? cargoType;
  final String? serviceMode; // New field
  final String? serviceType;
  final String? specialInstructions;

  final String? additionalNotes; // Terms & Notes from admin
  final String? adminFeedback; // Feedback for Info Required
  final String? handoverMethod;
  final String? warehouseDropOffLocation;

  // Routing Data (Phase 1 — region/city strings only)
  final String? routingSourceRegion;
  final String? routingSourceCity;
  final String? routingDestinationRegion;
  final String? routingDestinationCity;

  // New Pricing Breakdown Fields
  final double? baseFreightCharge;
  final double? estimatedHandlingFee;
  final double? firstMileCharge;
  final double? lastMileCharge;
  final double? tax;
  final double? discount;
  final String? clientName;
  final int? revisionCount;

  const Quotation({
    required this.id,
    this.quotationId,
    required this.createdDate,
    required this.totalAmount,
    required this.status,
    this.pdfUrl,
    required this.items,
    this.currency,
    this.origin,
    this.destination,
    this.pickupDate,
    this.deliveryDate,
    this.cargoType,
    this.serviceMode,
    this.serviceType,
    this.specialInstructions,
    this.additionalNotes,
    this.adminFeedback,
    this.handoverMethod,
    this.warehouseDropOffLocation,
    this.routingSourceRegion,
    this.routingSourceCity,
    this.routingDestinationRegion,
    this.routingDestinationCity,
    this.baseFreightCharge,
    this.estimatedHandlingFee,
    this.firstMileCharge,
    this.lastMileCharge,
    this.tax,
    this.discount,
    this.clientName,
    this.revisionCount,
  });

  Quotation copyWith({
    String? id,
    String? quotationId,
    DateTime? createdDate,
    double? totalAmount,
    QuotationStatus? status,
    String? pdfUrl,
    List<QuotationItem>? items,
    String? currency,
    QuotationAddress? origin,
    QuotationAddress? destination,
    DateTime? pickupDate,
    DateTime? deliveryDate,
    String? cargoType,
    String? serviceMode,
    String? serviceType,
    String? specialInstructions,
    String? additionalNotes,
    String? handoverMethod,
    String? warehouseDropOffLocation,
    String? routingSourceRegion,
    String? routingSourceCity,
    String? routingDestinationRegion,
    String? routingDestinationCity,
  }) {
    return Quotation(
      id: id ?? this.id,
      quotationId: quotationId ?? this.quotationId,
      createdDate: createdDate ?? this.createdDate,
      totalAmount: totalAmount ?? this.totalAmount,
      status: status ?? this.status,
      pdfUrl: pdfUrl ?? this.pdfUrl,
      items: items ?? this.items,
      currency: currency ?? this.currency,
      origin: origin ?? this.origin,
      destination: destination ?? this.destination,
      pickupDate: pickupDate ?? this.pickupDate,
      deliveryDate: deliveryDate ?? this.deliveryDate,
      cargoType: cargoType ?? this.cargoType,
      serviceMode: serviceMode ?? this.serviceMode,
      serviceType: serviceType ?? this.serviceType,
      specialInstructions: specialInstructions ?? this.specialInstructions,
      additionalNotes: additionalNotes ?? this.additionalNotes,
      handoverMethod: handoverMethod ?? this.handoverMethod,
      warehouseDropOffLocation:
          warehouseDropOffLocation ?? this.warehouseDropOffLocation,
      routingSourceRegion: routingSourceRegion ?? this.routingSourceRegion,
      routingSourceCity: routingSourceCity ?? this.routingSourceCity,
      routingDestinationRegion:
          routingDestinationRegion ?? this.routingDestinationRegion,
      routingDestinationCity:
          routingDestinationCity ?? this.routingDestinationCity,
      baseFreightCharge: baseFreightCharge ?? this.baseFreightCharge,
      estimatedHandlingFee: estimatedHandlingFee ?? this.estimatedHandlingFee,
      firstMileCharge: firstMileCharge ?? this.firstMileCharge,
      lastMileCharge: lastMileCharge ?? this.lastMileCharge,
      tax: tax ?? this.tax,
      discount: discount ?? this.discount,
      clientName: clientName ?? this.clientName,
      revisionCount: revisionCount ?? this.revisionCount,
    );
  }

  factory Quotation.fromJson(Map<String, dynamic> json) {
    final routingData = json['routingData'] as Map<String, dynamic>?;
    return Quotation(
      id: json['id'] as String,
      quotationId: json['quotationId'] as String?,
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
      currency: json['currency'] as String?,
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
      serviceMode: json['serviceMode'] as String?,
      serviceType: json['serviceType'] as String?,
      specialInstructions: json['specialInstructions'] as String?,
      additionalNotes: json['additionalNotes'] as String?,
      adminFeedback: json['adminFeedback'] as String?,
      handoverMethod: json['handoverMethod'] as String?,
      warehouseDropOffLocation: json['warehouseDropOffLocation'] as String?,
      // Phase 1 routing data
      routingSourceRegion: routingData?['sourceRegion'] as String?,
      routingSourceCity: routingData?['sourceCity'] as String?,
      routingDestinationRegion: routingData?['destinationRegion'] as String?,
      routingDestinationCity: routingData?['destinationCity'] as String?,
      // Map Pricing Details
      baseFreightCharge:
          (json['pricing']?['baseFreightCharge'] ??
                  json['baseFreightCharge'] as num?)
              ?.toDouble(),
      estimatedHandlingFee:
          (json['pricing']?['estimatedHandlingFee'] ??
                  json['estimatedHandlingFee'] as num?)
              ?.toDouble(),
      firstMileCharge:
          (json['pricing']?['firstMileCharge'] ??
                  json['firstMileCharge'] as num?)
              ?.toDouble(),
      lastMileCharge:
          (json['pricing']?['lastMileCharge'] ?? json['lastMileCharge'] as num?)
              ?.toDouble(),
      tax: (json['pricing']?['tax'] ?? json['tax'] as num?)?.toDouble(),
      discount: (json['pricing']?['discount'] ?? json['discount'] as num?)
          ?.toDouble(),
      clientName: (json['clientId'] is Map)
          ? json['clientId']['fullName'] as String?
          : null,
      revisionCount: (json['revisionCount'] as num?)?.toInt(),
    );
  }

  static QuotationStatus _parseStatus(String? status) {
    if (status == null) return QuotationStatus.requestSent;

    switch (status) {
      case 'DRAFT':
      case 'draft':
        return QuotationStatus.draft;
      case 'request_sent':
      case 'PENDING_ADMIN_REVIEW':
      case 'pending_admin_review':
      case 'Pending': // Legacy
        return QuotationStatus.requestSent;
      case 'approved':
      case 'VERIFIED':
      case 'verified':
        return QuotationStatus.approved;
      case 'PENDING_CUSTOMER_APPROVAL': // Admin priced quote — client must Accept or Revise
      case 'pending_customer_approval':
        return QuotationStatus.costCalculated;
      case 'ADDRESS_PROVIDED':
      case 'address_provided':
        return QuotationStatus.addressProvided;
      case 'details_submitted':
        return QuotationStatus.detailsSubmitted;
      case 'QUOTATION_GENERATED':
      case 'cost_calculated':
      case 'Approved': // Legacy
        return QuotationStatus.costCalculated;
      case 'QUOTATION_SENT':
      case 'sent':
      case 'Sent':
        return QuotationStatus.sent;
      case 'ACCEPTED':
      case 'accepted':
      case 'Accepted':
      case 'AWAITING_FINAL_CHARGE_SHEET': // Customer accepted, admin adding final charges
      case 'PAYMENT_PENDING': // Final charges set, awaiting payment
        return QuotationStatus.accepted;
      case 'REJECTED':
      case 'rejected':
      case 'Rejected': // Legacy
        return QuotationStatus.rejected;
      case 'BOOKED':
      case 'CONVERTED_TO_SHIPMENT': // Payment done, shipment created
      case 'ready_for_pickup':
      case 'Ready for Pickup': // Legacy
        return QuotationStatus.readyForPickup;
      case 'shipped':
        return QuotationStatus.shipped;
      case 'delivered':
        return QuotationStatus.delivered;

      case 'INFO_REQUIRED':
      case 'info_required':
        return QuotationStatus.infoRequired;
      default:
        return QuotationStatus.requestSent;
    }
  }

  Map<String, dynamic> toJson() {
    String statusStr;
    switch (status) {
      case QuotationStatus.draft:
        statusStr = 'DRAFT';
        break;
      case QuotationStatus.requestSent:
        statusStr = 'request_sent';
        break;
      case QuotationStatus.approved:
        statusStr = 'approved';
        break;
      case QuotationStatus.addressProvided:
        statusStr = 'ADDRESS_PROVIDED';
        break;
      case QuotationStatus.detailsSubmitted:
        statusStr = 'details_submitted';
        break;
      case QuotationStatus.costCalculated:
        statusStr = 'cost_calculated';
        break;
      case QuotationStatus.sent:
        statusStr = 'sent';
        break;
      case QuotationStatus.accepted:
        statusStr = 'accepted';
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
      case QuotationStatus.infoRequired:
        statusStr = 'info_required';
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
      'currency': currency,
      'origin': origin?.toJson(),
      'destination': destination?.toJson(),
      'pickupDate': pickupDate?.toIso8601String(),
      'deliveryDate': deliveryDate?.toIso8601String(),
      'cargoType': cargoType,
      'serviceMode': serviceMode,
      'serviceType': serviceType,
      'specialInstructions': specialInstructions,
      'additionalNotes': additionalNotes,

      'adminFeedback': adminFeedback,
      'handoverMethod': handoverMethod,
      'warehouseDropOffLocation': warehouseDropOffLocation,
    };
  }
}
