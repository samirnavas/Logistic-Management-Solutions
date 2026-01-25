import 'dart:convert';

class User {
  final String id;
  final String email;
  final String fullName;
  final String phone;
  final String country;
  final String customerCode;
  final String location;
  final String avatarUrl;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phone,
    required this.country,
    this.location = '',
    this.customerCode = '',
    this.avatarUrl = '',
  });

  /// Create a copy of this User with modified fields
  User copyWith({
    String? id,
    String? email,
    String? fullName,
    String? phone,
    String? country,
    String? location,
    String? customerCode,
    String? avatarUrl,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      country: country ?? this.country,
      location: location ?? this.location,
      customerCode: customerCode ?? this.customerCode,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'phone': phone,
      'country': country,
      'location': location,
      'customerCode': customerCode,
      'avatarUrl': avatarUrl,
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
      avatarUrl: map['avatarUrl'] ?? '',
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
        other.country == country &&
        other.avatarUrl == avatarUrl;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        email.hashCode ^
        fullName.hashCode ^
        phone.hashCode ^
        country.hashCode ^
        location.hashCode ^
        avatarUrl.hashCode;
  }
}
