import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final s = status.toUpperCase().replaceAll(' ', '_');

    Color textColor = Colors.blue[800]!;
    Color bgColor = Colors.blue[50]!;
    Color borderColor = Colors.blue[200]!;

    if (s.contains('DRAFT') || s.contains('COST_CALCULATED')) {
      textColor = Colors.grey[800]!;
      bgColor = Colors.grey[100]!;
      borderColor = Colors.grey[300]!;
    } else if (s.contains('INFO') ||
        s.contains('REQUIRED') ||
        s.contains('ACTION') ||
        s.contains('REJECTED') ||
        s.contains('CANCELLED')) {
      textColor = Colors.red[800]!;
      bgColor = Colors.red[50]!;
      borderColor = Colors.red[200]!;
    } else if (s.contains('PENDING') ||
        s.contains('REVIEW') ||
        s.contains('REQUEST_SENT') ||
        s.contains('NEGOTIATION')) {
      textColor = Colors.amber[800]!;
      bgColor = Colors.amber[50]!;
      borderColor = Colors.amber[200]!;
    } else if (s.contains('VERIFIED') ||
        s.contains('APPROVED') ||
        s.contains('SENT') ||
        s.contains('RECEIVED') ||
        s.contains('DELIVERED') ||
        s.contains('SHIPPED') ||
        s.contains('TRANSIT') ||
        s.contains('BOOKED')) {
      textColor = Colors.green[800]!;
      bgColor = Colors.green[50]!;
      borderColor = Colors.green[200]!;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        status.toUpperCase().replaceAll('_', ' '),
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.w600,
          fontSize: 10,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
