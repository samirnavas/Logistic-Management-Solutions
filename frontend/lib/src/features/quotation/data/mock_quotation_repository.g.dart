// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'mock_quotation_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$mockQuotationRepositoryHash() =>
    r'4094d7ea67260750e4d1f94d3394ec8cde0b5758';

/// See also [mockQuotationRepository].
@ProviderFor(mockQuotationRepository)
final mockQuotationRepositoryProvider =
    AutoDisposeProvider<MockQuotationRepository>.internal(
      mockQuotationRepository,
      name: r'mockQuotationRepositoryProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$mockQuotationRepositoryHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef MockQuotationRepositoryRef =
    AutoDisposeProviderRef<MockQuotationRepository>;
String _$quotationsHash() => r'becbabc7b64f7b39d9126181cb6750c69391aef6';

/// See also [quotations].
@ProviderFor(quotations)
final quotationsProvider = AutoDisposeFutureProvider<List<Quotation>>.internal(
  quotations,
  name: r'quotationsProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$quotationsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef QuotationsRef = AutoDisposeFutureProviderRef<List<Quotation>>;
String _$quotationByIdHash() => r'15704b9aa87104536db3821cdf653ed3df23bf96';

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

/// See also [quotationById].
@ProviderFor(quotationById)
const quotationByIdProvider = QuotationByIdFamily();

/// See also [quotationById].
class QuotationByIdFamily extends Family<AsyncValue<Quotation?>> {
  /// See also [quotationById].
  const QuotationByIdFamily();

  /// See also [quotationById].
  QuotationByIdProvider call(String id) {
    return QuotationByIdProvider(id);
  }

  @override
  QuotationByIdProvider getProviderOverride(
    covariant QuotationByIdProvider provider,
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
  String? get name => r'quotationByIdProvider';
}

/// See also [quotationById].
class QuotationByIdProvider extends AutoDisposeFutureProvider<Quotation?> {
  /// See also [quotationById].
  QuotationByIdProvider(String id)
    : this._internal(
        (ref) => quotationById(ref as QuotationByIdRef, id),
        from: quotationByIdProvider,
        name: r'quotationByIdProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$quotationByIdHash,
        dependencies: QuotationByIdFamily._dependencies,
        allTransitiveDependencies:
            QuotationByIdFamily._allTransitiveDependencies,
        id: id,
      );

  QuotationByIdProvider._internal(
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
    FutureOr<Quotation?> Function(QuotationByIdRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: QuotationByIdProvider._internal(
        (ref) => create(ref as QuotationByIdRef),
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
  AutoDisposeFutureProviderElement<Quotation?> createElement() {
    return _QuotationByIdProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is QuotationByIdProvider && other.id == id;
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
mixin QuotationByIdRef on AutoDisposeFutureProviderRef<Quotation?> {
  /// The parameter `id` of this provider.
  String get id;
}

class _QuotationByIdProviderElement
    extends AutoDisposeFutureProviderElement<Quotation?>
    with QuotationByIdRef {
  _QuotationByIdProviderElement(super.provider);

  @override
  String get id => (origin as QuotationByIdProvider).id;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
