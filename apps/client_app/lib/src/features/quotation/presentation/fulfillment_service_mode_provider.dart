import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/service_mode_calculator.dart';

/// Reactive [serviceMode] from current pickup/delivery selection (fulfillment dialog).
final fulfillmentComputedServiceModeProvider = Provider.autoDispose
    .family<String, (String pickupType, String deliveryType)>(
      (ref, tuple) => serviceModeFromPickupDeliveryTypes(tuple.$1, tuple.$2),
    );
