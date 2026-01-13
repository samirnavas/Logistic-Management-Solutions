/// Quotation status enum
enum QuotationStatus {
  pending,
  approved,
  rejected;

  String get displayName {
    switch (this) {
      case QuotationStatus.pending:
        return 'Pending';
      case QuotationStatus.approved:
        return 'Approved';
      case QuotationStatus.rejected:
        return 'Rejected';
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
      cost: (json['cost'] as num).toDouble(),
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
      requestId: json['requestId'] as String,
      createdDate: DateTime.parse(json['createdDate'] as String),
      totalAmount: (json['totalAmount'] as num).toDouble(),
      status: QuotationStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => QuotationStatus.pending,
      ),
      pdfUrl: json['pdfUrl'] as String?,
      items: (json['items'] as List<dynamic>)
          .map((item) => QuotationItem.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
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
