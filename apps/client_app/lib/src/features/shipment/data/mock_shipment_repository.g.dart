// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'mock_shipment_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$shipmentRepositoryHash() =>
    r'1fd66cdd93683da41f36303dc90ecbe3c3b0fb09';

/// See also [shipmentRepository].
@ProviderFor(shipmentRepository)
final shipmentRepositoryProvider =
    AutoDisposeProvider<ShipmentRepository>.internal(
      shipmentRepository,
      name: r'shipmentRepositoryProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$shipmentRepositoryHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ShipmentRepositoryRef = AutoDisposeProviderRef<ShipmentRepository>;
String _$shipmentListHash() => r'0bdb0aff1ca7dceb3f8583acc89fa5dad86fef8a';

/// Fetches the list of all shipments.
///
/// Usage in widgets:
/// ```dart
/// final shipmentsAsync = ref.watch(shipmentListProvider);
/// shipmentsAsync.when(
///   data: (shipments) => ListView(...),
///   loading: () => CircularProgressIndicator(),
///   error: (e, st) => Text('Error: $e'),
/// );
/// ```
///
/// Copied from [shipmentList].
@ProviderFor(shipmentList)
final shipmentListProvider = AutoDisposeFutureProvider<List<Shipment>>.internal(
  shipmentList,
  name: r'shipmentListProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$shipmentListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ShipmentListRef = AutoDisposeFutureProviderRef<List<Shipment>>;
String _$shipmentByIdHash() => r'9ae357da0124af044c0531c5cda87ffcf927b6ea';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// Fetches a single shipment by ID.
///
/// Usage:
/// ```dart
/// final shipmentAsync = ref.watch(shipmentByIdProvider('SHP-2026-001'));
/// ```
///
/// Copied from [shipmentById].
@ProviderFor(shipmentById)
const shipmentByIdProvider = ShipmentByIdFamily();

/// Fetches a single shipment by ID.
///
/// Usage:
/// ```dart
/// final shipmentAsync = ref.watch(shipmentByIdProvider('SHP-2026-001'));
/// ```
///
/// Copied from [shipmentById].
class ShipmentByIdFamily extends Family<AsyncValue<Shipment>> {
  /// Fetches a single shipment by ID.
  ///
  /// Usage:
  /// ```dart
  /// final shipmentAsync = ref.watch(shipmentByIdProvider('SHP-2026-001'));
  /// ```
  ///
  /// Copied from [shipmentById].
  const ShipmentByIdFamily();

  /// Fetches a single shipment by ID.
  ///
  /// Usage:
  /// ```dart
  /// final shipmentAsync = ref.watch(shipmentByIdProvider('SHP-2026-001'));
  /// ```
  ///
  /// Copied from [shipmentById].
  ShipmentByIdProvider call(String id) {
    return ShipmentByIdProvider(id);
  }

  @override
  ShipmentByIdProvider getProviderOverride(
    covariant ShipmentByIdProvider provider,
  ) {
    return call(provider.id);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'shipmentByIdProvider';
}

/// Fetches a single shipment by ID.
///
/// Usage:
/// ```dart
/// final shipmentAsync = ref.watch(shipmentByIdProvider('SHP-2026-001'));
/// ```
///
/// Copied from [shipmentById].
class ShipmentByIdProvider extends AutoDisposeFutureProvider<Shipment> {
  /// Fetches a single shipment by ID.
  ///
  /// Usage:
  /// ```dart
  /// final shipmentAsync = ref.watch(shipmentByIdProvider('SHP-2026-001'));
  /// ```
  ///
  /// Copied from [shipmentById].
  ShipmentByIdProvider(String id)
    : this._internal(
        (ref) => shipmentById(ref as ShipmentByIdRef, id),
        from: shipmentByIdProvider,
        name: r'shipmentByIdProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$shipmentByIdHash,
        dependencies: ShipmentByIdFamily._dependencies,
        allTransitiveDependencies:
            ShipmentByIdFamily._allTransitiveDependencies,
        id: id,
      );

  ShipmentByIdProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.id,
  }) : super.internal();

  final String id;

  @override
  Override overrideWith(
    FutureOr<Shipment> Function(ShipmentByIdRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: ShipmentByIdProvider._internal(
        (ref) => create(ref as ShipmentByIdRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<Shipment> createElement() {
    return _ShipmentByIdProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ShipmentByIdProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin ShipmentByIdRef on AutoDisposeFutureProviderRef<Shipment> {
  /// The parameter `id` of this provider.
  String get id;
}

class _ShipmentByIdProviderElement
    extends AutoDisposeFutureProviderElement<Shipment>
    with ShipmentByIdRef {
  _ShipmentByIdProviderElement(super.provider);

  @override
  String get id => (origin as ShipmentByIdProvider).id;
}

String _$shipmentByTrackingHash() =>
    r'8ebbeba91a300f720f5c6e5f10f6fb91d3ea30db';

/// Fetches a shipment by tracking number.
///
/// Copied from [shipmentByTracking].
@ProviderFor(shipmentByTracking)
const shipmentByTrackingProvider = ShipmentByTrackingFamily();

/// Fetches a shipment by tracking number.
///
/// Copied from [shipmentByTracking].
class ShipmentByTrackingFamily extends Family<AsyncValue<Shipment>> {
  /// Fetches a shipment by tracking number.
  ///
  /// Copied from [shipmentByTracking].
  const ShipmentByTrackingFamily();

  /// Fetches a shipment by tracking number.
  ///
  /// Copied from [shipmentByTracking].
  ShipmentByTrackingProvider call(String trackingNumber) {
    return ShipmentByTrackingProvider(trackingNumber);
  }

  @override
  ShipmentByTrackingProvider getProviderOverride(
    covariant ShipmentByTrackingProvider provider,
  ) {
    return call(provider.trackingNumber);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'shipmentByTrackingProvider';
}

/// Fetches a shipment by tracking number.
///
/// Copied from [shipmentByTracking].
class ShipmentByTrackingProvider extends AutoDisposeFutureProvider<Shipment> {
  /// Fetches a shipment by tracking number.
  ///
  /// Copied from [shipmentByTracking].
  ShipmentByTrackingProvider(String trackingNumber)
    : this._internal(
        (ref) =>
            shipmentByTracking(ref as ShipmentByTrackingRef, trackingNumber),
        from: shipmentByTrackingProvider,
        name: r'shipmentByTrackingProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$shipmentByTrackingHash,
        dependencies: ShipmentByTrackingFamily._dependencies,
        allTransitiveDependencies:
            ShipmentByTrackingFamily._allTransitiveDependencies,
        trackingNumber: trackingNumber,
      );

  ShipmentByTrackingProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.trackingNumber,
  }) : super.internal();

  final String trackingNumber;

  @override
  Override overrideWith(
    FutureOr<Shipment> Function(ShipmentByTrackingRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: ShipmentByTrackingProvider._internal(
        (ref) => create(ref as ShipmentByTrackingRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        trackingNumber: trackingNumber,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<Shipment> createElement() {
    return _ShipmentByTrackingProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ShipmentByTrackingProvider &&
        other.trackingNumber == trackingNumber;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, trackingNumber.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin ShipmentByTrackingRef on AutoDisposeFutureProviderRef<Shipment> {
  /// The parameter `trackingNumber` of this provider.
  String get trackingNumber;
}

class _ShipmentByTrackingProviderElement
    extends AutoDisposeFutureProviderElement<Shipment>
    with ShipmentByTrackingRef {
  _ShipmentByTrackingProviderElement(super.provider);

  @override
  String get trackingNumber =>
      (origin as ShipmentByTrackingProvider).trackingNumber;
}

String _$shipmentsByStatusHash() => r'd86b4234079a0d0590c019a2876a62849258b5ad';

/// Fetches shipments filtered by status.
///
/// Copied from [shipmentsByStatus].
@ProviderFor(shipmentsByStatus)
const shipmentsByStatusProvider = ShipmentsByStatusFamily();

/// Fetches shipments filtered by status.
///
/// Copied from [shipmentsByStatus].
class ShipmentsByStatusFamily extends Family<AsyncValue<List<Shipment>>> {
  /// Fetches shipments filtered by status.
  ///
  /// Copied from [shipmentsByStatus].
  const ShipmentsByStatusFamily();

  /// Fetches shipments filtered by status.
  ///
  /// Copied from [shipmentsByStatus].
  ShipmentsByStatusProvider call(String status) {
    return ShipmentsByStatusProvider(status);
  }

  @override
  ShipmentsByStatusProvider getProviderOverride(
    covariant ShipmentsByStatusProvider provider,
  ) {
    return call(provider.status);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'shipmentsByStatusProvider';
}

/// Fetches shipments filtered by status.
///
/// Copied from [shipmentsByStatus].
class ShipmentsByStatusProvider
    extends AutoDisposeFutureProvider<List<Shipment>> {
  /// Fetches shipments filtered by status.
  ///
  /// Copied from [shipmentsByStatus].
  ShipmentsByStatusProvider(String status)
    : this._internal(
        (ref) => shipmentsByStatus(ref as ShipmentsByStatusRef, status),
        from: shipmentsByStatusProvider,
        name: r'shipmentsByStatusProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$shipmentsByStatusHash,
        dependencies: ShipmentsByStatusFamily._dependencies,
        allTransitiveDependencies:
            ShipmentsByStatusFamily._allTransitiveDependencies,
        status: status,
      );

  ShipmentsByStatusProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.status,
  }) : super.internal();

  final String status;

  @override
  Override overrideWith(
    FutureOr<List<Shipment>> Function(ShipmentsByStatusRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: ShipmentsByStatusProvider._internal(
        (ref) => create(ref as ShipmentsByStatusRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        status: status,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<Shipment>> createElement() {
    return _ShipmentsByStatusProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ShipmentsByStatusProvider && other.status == status;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, status.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin ShipmentsByStatusRef on AutoDisposeFutureProviderRef<List<Shipment>> {
  /// The parameter `status` of this provider.
  String get status;
}

class _ShipmentsByStatusProviderElement
    extends AutoDisposeFutureProviderElement<List<Shipment>>
    with ShipmentsByStatusRef {
  _ShipmentsByStatusProviderElement(super.provider);

  @override
  String get status => (origin as ShipmentsByStatusProvider).status;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
