import 'package:bb_logistics/src/core/api/api_service.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../domain/quotation.dart';

part 'quotation_repository.g.dart';

class QuotationRepository {
  final ApiService _apiService;
  final String? _currentUserId;

  QuotationRepository(this._apiService, this._currentUserId);

  /// Get pending quotations (Request Sent)
  Future<List<Quotation>> getQuotations() async {
    if (_currentUserId == null) return [];

    // We are implementing for client app mainly, so fetching client app visibility quotations
    // The backend endpoint exports.getClientQuotations = async (req, res) => { ... }
    // Route: router.get('/client/:clientId', quotationController.getClientQuotations);

    // However, the mock behavior was returning a mix of logic.
    // Let's stick to the client app endpoint.
    final response = await _apiService.getRequest(
      '/api/quotations/client/$_currentUserId',
    );

    // Response format: { quotations: [...], pagination: {...} }
    if (response is Map<String, dynamic> &&
        response.containsKey('quotations')) {
      final List<dynamic> list = response['quotations'];
      return list.map((json) {
        if (json.containsKey('_id') && !json.containsKey('id')) {
          json['id'] = json['_id'];
        }
        return Quotation.fromJson(json);
      }).toList();
    }
    return [];
  }

  /// Get single quotation by ID
  Future<Quotation?> getQuotationById(String id) async {
    if (_currentUserId == null) return null;
    // Backend: exports.getClientQuotation
    // Route: router.get('/client/:clientId/:id', quotationController.getClientQuotation);

    try {
      final response = await _apiService.getRequest(
        '/api/quotations/client/$_currentUserId/$id',
      );
      if (response is Map<String, dynamic>) {
        if (response.containsKey('_id') && !response.containsKey('id')) {
          response['id'] = response['_id'];
        }
        return Quotation.fromJson(response);
      }
    } catch (e) {
      // If not found or error
      return null;
    }
    return null;
  }

  /// Confirm address for quotation
  Future<void> confirmAddress(
    String id,
    Map<String, dynamic> pickupAddress,
    Map<String, dynamic> deliveryAddress,
  ) async {
    await _apiService.putRequest('/api/quotations/$id/confirm-address', {
      'pickupAddress': pickupAddress,
      'deliveryAddress': deliveryAddress,
    });
  }

  /// Create a new quotation request
  Future<Quotation> createQuotation(Map<String, dynamic> requestData) async {
    final response = await _apiService.postRequest(
      '/api/quotations',
      requestData,
    );

    // Response format: { message: "...", quotation: {...} }
    if (response is Map<String, dynamic> && response.containsKey('quotation')) {
      final quotationJson = response['quotation'];
      if (quotationJson.containsKey('_id') &&
          !quotationJson.containsKey('id')) {
        quotationJson['id'] = quotationJson['_id'];
      }
      return Quotation.fromJson(quotationJson);
    }
    throw Exception('Failed to parse created quotation');
  }
}

@riverpod
QuotationRepository quotationRepository(Ref ref) {
  final authState = ref.watch(authRepositoryProvider);
  final userId = authState.value?.id;
  return QuotationRepository(ApiService(), userId);
}

@riverpod
Future<List<Quotation>> quotations(Ref ref) async {
  final repository = ref.watch(quotationRepositoryProvider);
  return repository.getQuotations();
}

@riverpod
Future<Quotation?> quotationById(Ref ref, String id) async {
  final repository = ref.watch(quotationRepositoryProvider);
  return repository.getQuotationById(id);
}
