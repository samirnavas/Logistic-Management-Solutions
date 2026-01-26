import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ShipmentItemFormData {
  String description;
  int quantity;
  double weight;
  dynamic dimensions; // String "LxWxH" or map
  List<String> images;
  List<File> localPhotos; // Local files to be uploaded
  String category;
  bool isHazardous;
  String? videoUrl;
  double? targetRate;
  double? packingVolume;
  String priority;
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
    this.videoUrl,
    this.targetRate,
    this.packingVolume,
    this.priority = 'Standard',
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
    String? videoUrl,
    double? targetRate,
    double? packingVolume,
    String? priority,
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
      videoUrl: videoUrl ?? this.videoUrl,
      targetRate: targetRate ?? this.targetRate,
      packingVolume: packingVolume ?? this.packingVolume,
      priority: priority ?? this.priority,
      cost: cost ?? this.cost,
    );
  }
}

class ShipmentFormState {
  final List<ShipmentItemFormData> items;

  const ShipmentFormState({required this.items});

  ShipmentFormState copyWith({List<ShipmentItemFormData>? items}) {
    return ShipmentFormState(items: items ?? this.items);
  }
}

class ShipmentFormNotifier extends StateNotifier<ShipmentFormState> {
  ShipmentFormNotifier() : super(const ShipmentFormState(items: [])) {
    // Initialize with one empty item
    if (state.items.isEmpty) {
      addItem();
    }
  }

  void addItem() {
    state = state.copyWith(items: [...state.items, ShipmentItemFormData()]);
  }

  void removeItem(int index) {
    if (state.items.length > 1) {
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
}

final shipmentFormProvider =
    StateNotifierProvider<ShipmentFormNotifier, ShipmentFormState>((ref) {
      return ShipmentFormNotifier();
    });
