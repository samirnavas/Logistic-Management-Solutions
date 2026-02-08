class Warehouse {
  final String id;
  final String name;
  final String code;
  final WarehouseAddress address;
  final bool isActive;

  const Warehouse({
    required this.id,
    required this.name,
    required this.code,
    required this.address,
    this.isActive = true,
  });

  factory Warehouse.fromJson(Map<String, dynamic> json) {
    return Warehouse(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      address: WarehouseAddress.fromJson(json['address'] ?? {}),
      isActive: json['isActive'] ?? true,
    );
  }

  // @override
  // List<Object?> get props => [id, name, code, address, isActive];
}

class WarehouseAddress {
  final String addressLine;
  final String city;
  final String state;
  final String country;
  final String zip;

  const WarehouseAddress({
    required this.addressLine,
    required this.city,
    required this.state,
    required this.country,
    required this.zip,
  });

  factory WarehouseAddress.fromJson(Map<String, dynamic> json) {
    return WarehouseAddress(
      addressLine: json['addressLine'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      country: json['country'] ?? '',
      zip: json['zip'] ?? '',
    );
  }

  String get fullAddress =>
      '$addressLine, $city, ${state.isNotEmpty ? '$state, ' : ''}$country $zip';

  // @override
  // List<Object?> get props => [addressLine, city, state, country, zip];
}
