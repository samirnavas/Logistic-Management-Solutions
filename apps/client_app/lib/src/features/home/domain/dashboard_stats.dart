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

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      requests: json['requests'] as int? ?? 0,
      shipped: json['shipped'] as int? ?? 0,
      delivered: json['delivered'] as int? ?? 0,
      cleared: json['cleared'] as int? ?? 0,
      dispatch: json['dispatch'] as int? ?? 0,
      waiting: json['waiting'] as int? ?? 0,
    );
  }
}
