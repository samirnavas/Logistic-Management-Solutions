import 'dart:convert';

class User {
  final String id;
  final String email;
  final String fullName;
  final String phone;
  final String country;
  final String customerCode;
  final String location;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phone,
    required this.country,
    this.location = '',
    this.customerCode = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'phone': phone,
      'country': country,
      'location': location,
      'customerCode': customerCode,
    };
  }

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['_id'] ?? map['id'] ?? '',
      email: map['email'] ?? '',
      fullName: map['fullName'] ?? '',
      phone: map['phone'] ?? '',
      country: map['country'] ?? '',
      location: map['location'] ?? '',
      customerCode: map['customerCode'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory User.fromJson(String source) => User.fromMap(json.decode(source));

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is User &&
        other.id == id &&
        other.email == email &&
        other.fullName == fullName &&
        other.phone == phone &&
        other.country == country;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        email.hashCode ^
        fullName.hashCode ^
        phone.hashCode ^
        country.hashCode ^
        location.hashCode;
  }
}
