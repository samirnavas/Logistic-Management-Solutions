class DashboardStats {
  final int requests;
  final int shipped;
  final int delivered;
  final int cleared;
  final int dispatch;
  final int waiting;

  DashboardStats({
    required this.requests,
    required this.shipped,
    required this.delivered,
    required this.cleared,
    required this.dispatch,
    required this.waiting,
  });

  static int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    final payload = (json['data'] is Map<String, dynamic>)
        ? json['data'] as Map<String, dynamic>
        : json;
    return DashboardStats(
      requests: _asInt(payload['requests']),
      shipped: _asInt(payload['shipped']),
      delivered: _asInt(payload['delivered']),
      cleared: _asInt(payload['cleared']),
      dispatch: _asInt(payload['dispatch']),
      waiting: _asInt(payload['waiting']),
    );
  }
}
