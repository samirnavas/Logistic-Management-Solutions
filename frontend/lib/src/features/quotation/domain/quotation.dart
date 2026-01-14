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
class Quotation {
  final String id;
  final String requestId;
  final DateTime createdDate;
  final double totalAmount;
  final QuotationStatus status;
  final String? pdfUrl;
  final List<QuotationItem> items;

  const Quotation({
    required this.id,
    required this.requestId,
    required this.createdDate,
    required this.totalAmount,
    required this.status,
    this.pdfUrl,
    required this.items,
  });

  Quotation copyWith({
    String? id,
    String? requestId,
    DateTime? createdDate,
    double? totalAmount,
    QuotationStatus? status,
    String? pdfUrl,
    List<QuotationItem>? items,
  }) {
    return Quotation(
      id: id ?? this.id,
      requestId: requestId ?? this.requestId,
      createdDate: createdDate ?? this.createdDate,
      totalAmount: totalAmount ?? this.totalAmount,
      status: status ?? this.status,
      pdfUrl: pdfUrl ?? this.pdfUrl,
      items: items ?? this.items,
    );
  }

  factory Quotation.fromJson(Map<String, dynamic> json) {
    return Quotation(
      id: json['id'] as String,
      // Handle populated requestId object or string id
      requestId: json['requestId'] is Map
          ? json['requestId']['_id']
          : (json['requestId'] as String? ?? ''),
      createdDate: DateTime.parse(
        json['createdAt'] ?? json['createdDate'],
      ), // Backend uses createdAt
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
    );
  }

  static QuotationStatus _parseStatus(String? status) {
    if (status == null) return QuotationStatus.pending;

    switch (status) {
      case 'Draft':
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
      'requestId': requestId,
      'createdDate': createdDate.toIso8601String(),
      'totalAmount': totalAmount,
      'status': status.name,
      'pdfUrl': pdfUrl,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }
}
