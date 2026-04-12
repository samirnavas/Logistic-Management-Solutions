/// High-level origin / destination endpoint for fulfillment (first-mile / last-mile).
enum FulfillmentEndpointKind { home, warehouse }

/// Canonical [Quotation.serviceMode] strings (must match Mongoose enum).
abstract final class QuotationServiceModeValues {
  static const doorToDoor = 'Door to Door';
  static const doorToWarehouse = 'Door to Warehouse';
  static const warehouseToDoor = 'Warehouse to Door';
  static const warehouseToWarehouse = 'Warehouse to Warehouse';
}

/// Pure mapping: Home vs Warehouse at each end → backend `serviceMode` string.
String serviceModeFromEndpointKinds(
  FulfillmentEndpointKind origin,
  FulfillmentEndpointKind destination,
) {
  switch ((origin, destination)) {
    case (FulfillmentEndpointKind.home, FulfillmentEndpointKind.home):
      return QuotationServiceModeValues.doorToDoor;
    case (FulfillmentEndpointKind.home, FulfillmentEndpointKind.warehouse):
      return QuotationServiceModeValues.doorToWarehouse;
    case (FulfillmentEndpointKind.warehouse, FulfillmentEndpointKind.home):
      return QuotationServiceModeValues.warehouseToDoor;
    case (FulfillmentEndpointKind.warehouse, FulfillmentEndpointKind.warehouse):
      return QuotationServiceModeValues.warehouseToWarehouse;
  }
}

FulfillmentEndpointKind _originKindFromPickupType(String pickupType) {
  return pickupType == 'HOME_PICKUP'
      ? FulfillmentEndpointKind.home
      : FulfillmentEndpointKind.warehouse;
}

FulfillmentEndpointKind _destinationKindFromDeliveryType(String deliveryType) {
  return deliveryType == 'HOME_DELIVERY'
      ? FulfillmentEndpointKind.home
      : FulfillmentEndpointKind.warehouse;
}

/// Bridge from API fulfillment type strings to [serviceModeFromEndpointKinds].
String serviceModeFromPickupDeliveryTypes(
  String pickupType,
  String deliveryType,
) {
  return serviceModeFromEndpointKinds(
    _originKindFromPickupType(pickupType),
    _destinationKindFromDeliveryType(deliveryType),
  );
}
