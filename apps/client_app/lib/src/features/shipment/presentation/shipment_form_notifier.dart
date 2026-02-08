import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../quotation/data/quotation_repository.dart';

class ShipmentItemFormData {
  String description;
  int quantity;
  double weight;
  dynamic dimensions; // String "LxWxH" or map
  List<String> images;
  List<File> localPhotos; // Local files to be uploaded
  String category;
  bool isHazardous;
  String? hsCode;
  String? videoUrl;
  double? targetRate;
  double? declaredValue; // New field
  String targetCurrency;
  double? packingVolume;
  // Financials
  double cost;

  ShipmentItemFormData({
    this.description = '',
    this.quantity = 1,
    this.weight = 0.0,
    this.dimensions = '',
    this.images = const [],
    this.localPhotos = const [],
    this.category = 'General',
    this.isHazardous = false,
    this.hsCode,
    this.videoUrl,
    this.targetRate,
    this.declaredValue,
    this.targetCurrency = 'USD',
    this.packingVolume,
    this.cost = 0.0,
  });

  ShipmentItemFormData copyWith({
    String? description,
    int? quantity,
    double? weight,
    dynamic dimensions,
    List<String>? images,
    List<File>? localPhotos,
    String? category,
    bool? isHazardous,
    String? hsCode,
    String? videoUrl,
    double? targetRate,
    double? declaredValue,
    String? targetCurrency,
    double? packingVolume,
    double? cost,
  }) {
    return ShipmentItemFormData(
      description: description ?? this.description,
      quantity: quantity ?? this.quantity,
      weight: weight ?? this.weight,
      dimensions: dimensions ?? this.dimensions,
      images: images ?? this.images,
      localPhotos: localPhotos ?? this.localPhotos,
      category: category ?? this.category,
      isHazardous: isHazardous ?? this.isHazardous,
      hsCode: hsCode ?? this.hsCode,
      videoUrl: videoUrl ?? this.videoUrl,
      targetRate: targetRate ?? this.targetRate,
      declaredValue: declaredValue ?? this.declaredValue,
      targetCurrency: targetCurrency ?? this.targetCurrency,
      packingVolume: packingVolume ?? this.packingVolume,
      cost: cost ?? this.cost,
    );
  }
}

class ShipmentFormState {
  final List<ShipmentItemFormData> items;
  final bool isLoading;
  final String? error;
  final String? successMessage;
  final String selectedServiceMode;

  const ShipmentFormState({
    required this.items,
    this.isLoading = false,
    this.error,
    this.successMessage,
    this.selectedServiceMode = 'door_to_door',
  });

  ShipmentFormState copyWith({
    List<ShipmentItemFormData>? items,
    bool? isLoading,
    String? error,
    String? successMessage,
    String? selectedServiceMode,
  }) {
    return ShipmentFormState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error:
          error, // Pass null to clear if needed, but normally we explicitly manage it
      successMessage: successMessage,
      selectedServiceMode: selectedServiceMode ?? this.selectedServiceMode,
    );
  }
}

class ShipmentFormNotifier extends StateNotifier<ShipmentFormState> {
  final QuotationRepository _repository;

  ShipmentFormNotifier(this._repository)
    : super(const ShipmentFormState(items: []));

  void addItem([ShipmentItemFormData? item]) {
    state = state.copyWith(
      items: [...state.items, item ?? ShipmentItemFormData()],
    );
  }

  void removeItem(int index) {
    if (index >= 0 && index < state.items.length) {
      // Ensure index is valid
      final items = [...state.items];
      items.removeAt(index);
      state = state.copyWith(items: items);
    }
  }

  void updateItem(int index, ShipmentItemFormData item) {
    if (index >= 0 && index < state.items.length) {
      final items = [...state.items];
      items[index] = item;
      state = state.copyWith(items: items);
    }
  }

  void insertItem(int index, ShipmentItemFormData item) {
    if (index >= 0 && index <= state.items.length) {
      final items = [...state.items];
      items.insert(index, item);
      state = state.copyWith(items: items);
    }
  }

  void setItems(List<ShipmentItemFormData> items) {
    state = state.copyWith(items: items);
  }

  void setServiceMode(String mode) {
    state = state.copyWith(selectedServiceMode: mode);
  }

  Future<void> saveDraft(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, error: null, successMessage: null);
    try {
      await _repository.saveAsDraft(data);
      state = state.copyWith(
        isLoading: false,
        successMessage: 'Draft saved! You can resume this later.',
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> submitUpdate(String id, Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, error: null, successMessage: null);
    try {
      await _repository.submitQuotation(id, data);
      state = state.copyWith(
        isLoading: false,
        successMessage: 'Request updated and submitted successfully!',
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final shipmentFormProvider =
    StateNotifierProvider<ShipmentFormNotifier, ShipmentFormState>((ref) {
      final repository = ref.watch(quotationRepositoryProvider);
      return ShipmentFormNotifier(repository);
    });
