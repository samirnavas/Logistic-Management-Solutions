import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../domain/quotation.dart';

part 'mock_quotation_repository.g.dart';

/// Mock repository for quotation data
class MockQuotationRepository {
  /// Returns a list of mock quotations for demonstration
  Future<List<Quotation>> getQuotations() async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 800));

    return _mockQuotations;
  }

  /// Returns a single quotation by ID
  Future<Quotation?> getQuotationById(String id) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));

    try {
      return _mockQuotations.firstWhere((q) => q.id == id);
    } catch (_) {
      return null;
    }
  }
}

/// Mock data for quotations
final List<Quotation> _mockQuotations = [
  Quotation(
    id: 'QT-2025-001',
    requestId: 'REQ-2025-001',
    createdDate: DateTime(2025, 1, 8),
    totalAmount: 2450.00,
    status: QuotationStatus.approved,
    pdfUrl: 'assets/sample_invoice.pdf',
    items: const [
      QuotationItem(description: 'International Freight (Air)', cost: 1500.00),
      QuotationItem(description: 'Customs Clearance', cost: 350.00),
      QuotationItem(description: 'Door-to-Door Delivery', cost: 400.00),
      QuotationItem(description: 'Insurance', cost: 150.00),
      QuotationItem(description: 'Documentation Fee', cost: 50.00),
    ],
  ),
  Quotation(
    id: 'QT-2025-002',
    requestId: 'REQ-2025-002',
    createdDate: DateTime(2025, 1, 10),
    totalAmount: 875.50,
    status: QuotationStatus.pending,
    pdfUrl: 'assets/sample_invoice.pdf',
    items: const [
      QuotationItem(description: 'Domestic Freight', cost: 450.00),
      QuotationItem(description: 'Warehouse Handling', cost: 125.50),
      QuotationItem(description: 'Packaging Service', cost: 200.00),
      QuotationItem(description: 'Documentation Fee', cost: 100.00),
    ],
  ),
  Quotation(
    id: 'QT-2025-003',
    requestId: 'REQ-2025-003',
    createdDate: DateTime(2025, 1, 5),
    totalAmount: 5230.00,
    status: QuotationStatus.approved,
    pdfUrl: 'assets/sample_invoice.pdf',
    items: const [
      QuotationItem(description: 'International Freight (Sea)', cost: 3200.00),
      QuotationItem(description: 'Container Loading', cost: 550.00),
      QuotationItem(description: 'Port Handling Charges', cost: 480.00),
      QuotationItem(description: 'Customs Clearance', cost: 400.00),
      QuotationItem(description: 'Insurance', cost: 300.00),
      QuotationItem(description: 'Documentation Fee', cost: 150.00),
      QuotationItem(description: 'Local Delivery', cost: 150.00),
    ],
  ),
  Quotation(
    id: 'QT-2024-015',
    requestId: 'REQ-2024-015',
    createdDate: DateTime(2024, 12, 18),
    totalAmount: 1200.00,
    status: QuotationStatus.rejected,
    pdfUrl: 'assets/sample_invoice.pdf',
    items: const [
      QuotationItem(description: 'Express Freight (Air)', cost: 850.00),
      QuotationItem(description: 'Handling Charges', cost: 200.00),
      QuotationItem(description: 'Documentation Fee', cost: 150.00),
    ],
  ),
  Quotation(
    id: 'QT-2024-014',
    requestId: 'REQ-2024-014',
    createdDate: DateTime(2024, 12, 15),
    totalAmount: 3780.00,
    status: QuotationStatus.approved,
    pdfUrl: 'assets/sample_invoice.pdf',
    items: const [
      QuotationItem(description: 'International Freight (Sea)', cost: 2400.00),
      QuotationItem(description: 'Container Loading', cost: 450.00),
      QuotationItem(description: 'Port Charges', cost: 380.00),
      QuotationItem(description: 'Customs Clearance', cost: 300.00),
      QuotationItem(description: 'Insurance', cost: 250.00),
    ],
  ),
  Quotation(
    id: 'QT-2024-013',
    requestId: 'REQ-2024-013',
    createdDate: DateTime(2024, 12, 10),
    totalAmount: 650.00,
    status: QuotationStatus.pending,
    pdfUrl: 'assets/sample_invoice.pdf',
    items: const [
      QuotationItem(description: 'Local Freight', cost: 350.00),
      QuotationItem(description: 'Packaging', cost: 150.00),
      QuotationItem(description: 'Documentation Fee', cost: 150.00),
    ],
  ),
];

@riverpod
MockQuotationRepository mockQuotationRepository(Ref ref) {
  return MockQuotationRepository();
}

@riverpod
Future<List<Quotation>> quotations(Ref ref) async {
  final repository = ref.watch(mockQuotationRepositoryProvider);
  return repository.getQuotations();
}

@riverpod
Future<Quotation?> quotationById(Ref ref, String id) async {
  final repository = ref.watch(mockQuotationRepositoryProvider);
  return repository.getQuotationById(id);
}
