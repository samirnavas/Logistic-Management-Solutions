class Address {
  final String id;
  final String label;
  final String addressLine;
  final String city;
  final String state;
  final String country;
  final String zipCode;
  final bool isDefault;
  final String contactName;
  final String contactPhone;

  Address({
    required this.id,
    required this.label,
    required this.addressLine,
    required this.city,
    required this.state,
    required this.country,
    required this.zipCode,
    this.isDefault = false,
    this.contactName = '',
    this.contactPhone = '',
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['_id'] ?? json['id'] ?? '',
      label: json['label'] ?? '',
      addressLine: json['addressLine'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      country: json['country'] ?? '',
      zipCode: json['zipCode'] ?? '',
      isDefault: json['isDefault'] ?? false,
      contactName: json['contactName'] ?? '',
      contactPhone: json['contactPhone'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'addressLine': addressLine,
      'city': city,
      'state': state,
      'country': country,
      'zipCode': zipCode,
      'isDefault': isDefault,
      'contactName': contactName,
      'contactPhone': contactPhone,
    };
  }
}
