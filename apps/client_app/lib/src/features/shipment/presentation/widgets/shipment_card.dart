import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:flutter/material.dart';

class ShipmentCard extends StatelessWidget {
  final String shipmentId;
  final String boxId;
  final String status;
  final String type; // Air/Sea
  final String date;
  final String product;
  final String updated;
  final VoidCallback? onTrack;
  final VoidCallback? onViewDetails;
  final VoidCallback? onTap;

  const ShipmentCard({
    super.key,
    required this.shipmentId,
    required this.boxId,
    required this.status,
    required this.type,
    required this.date,
    this.product = 'Electronics',
    this.updated = '2 hrs ago',
    this.onTrack,
    this.onViewDetails,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Determine if we're on a small screen
        final isSmallScreen = constraints.maxWidth < 320;
        final isMediumScreen = constraints.maxWidth < 400;

        // Responsive image size
        final imageSize = isSmallScreen ? 60.0 : (isMediumScreen ? 70.0 : 80.0);

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              // Subtle light blue glow for depth
              BoxShadow(
                color: AppTheme.primaryBlue.withValues(alpha: 0.08),
                blurRadius: 12,
                spreadRadius: 0,
                offset: const Offset(0, 4),
              ),
              BoxShadow(
                color: AppTheme.primaryBlue.withValues(alpha: 0.04),
                blurRadius: 20,
                spreadRadius: 2,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: onTap,
              child: Padding(
                padding: EdgeInsets.all(isSmallScreen ? 8.0 : 12.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left Image
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: imageSize,
                        height: imageSize,
                        color: Colors.grey[200],
                        child: Icon(
                          Icons.inventory_2_outlined,
                          color: Colors.grey,
                          size: isSmallScreen ? 24 : 32,
                        ),
                      ),
                    ),
                    SizedBox(width: isSmallScreen ? 8 : 12),
                    // Right Content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header: ID and Status
                          _buildHeader(context, isSmallScreen),
                          const SizedBox(height: 8),
                          // Details Grid
                          _buildDetailRow(context, 'Quantity:', boxId),
                          _buildDetailRow(context, 'Updated:', updated),
                          _buildDetailRow(context, 'Route:', product),
                          _buildDetailRow(
                            context,
                            'Shipment Mode:',
                            '$type Freight',
                          ),
                          _buildDetailRow(context, 'Expected Delivery:', date),
                          const SizedBox(height: 12),
                          // Buttons - responsive layout
                          _buildButtons(context, isSmallScreen),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(BuildContext context, bool isSmallScreen) {
    final statusColor = _getStatusColor(status);
    final statusBgColor = statusColor.withValues(alpha: 0.1);

    return Wrap(
      spacing: 8,
      runSpacing: 4,
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text(
          '$shipmentId',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: AppTheme.primaryBlue,
            fontWeight: FontWeight.bold,
            fontSize: isSmallScreen ? 12 : 14,
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: statusBgColor,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            status.toUpperCase().replaceAll('_', ' '),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: statusColor,
              fontWeight: FontWeight.w600,
              fontSize: isSmallScreen ? 10 : 12,
            ),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    // Normalize status
    final s = status.toUpperCase().replaceAll(' ', '_');

    // Status Badges:
    // DRAFT: Grey color.
    // INFO_REQUIRED: Red/Orange (Action Needed).
    // PENDING_REVIEW: Yellow.
    // VERIFIED: Blue.
    // QUOTATION_SENT: Green (Ready to Book).

    if (s.contains('DRAFT') || s.contains('COST_CALCULATED')) {
      return Colors.grey[600]!;
    } else if (s.contains('INFO') ||
        s.contains('REQUIRED') ||
        s.contains('ACTION')) {
      return Colors.red[700]!;
    } else if (s.contains('PENDING') ||
        s.contains('REVIEW') ||
        s.contains('REQUEST_SENT')) {
      return Colors.orange[800]!; // Yellow/Orange
    } else if (s.contains('VERIFIED') || s.contains('APPROVED')) {
      return Colors.blue[700]!;
    } else if (s.contains('SENT') ||
        s.contains('RECEIVED') ||
        s == 'QUOTATION_SENT') {
      return Colors.green[700]!;
    } else if (s.contains('DELIVERED')) {
      return Colors.green[800]!;
    } else if (s.contains('SHIPPED') || s.contains('TRANSIT')) {
      return Colors.blue[800]!;
    }

    return AppTheme.primaryBlue;
  }

  Widget _buildButtons(BuildContext context, bool isSmallScreen) {
    final buttonHeight = isSmallScreen ? 28.0 : 32.0;
    final fontSize = isSmallScreen ? 10.0 : 12.0;

    return Row(
      children: [
        Expanded(
          child: ElevatedButton(
            onPressed: onTrack,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryBlue,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(
                horizontal: isSmallScreen ? 4 : 8,
                vertical: 0,
              ),
              minimumSize: Size(0, buttonHeight),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                isSmallScreen ? 'Track' : 'Track Shipment',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: Colors.white,
                  fontSize: fontSize,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton(
            onPressed: onViewDetails,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.primaryBlue,
              side: const BorderSide(color: AppTheme.primaryBlue),
              padding: EdgeInsets.symmetric(
                horizontal: isSmallScreen ? 4 : 8,
                vertical: 0,
              ),
              minimumSize: Size(0, buttonHeight),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                isSmallScreen ? 'Details' : 'View Details',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: AppTheme.primaryBlue,
                  fontSize: fontSize,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[500],
              fontSize: 11,
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.black87,
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
        ],
      ),
    );
  }
}
