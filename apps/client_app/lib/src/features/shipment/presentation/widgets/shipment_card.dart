import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/status_badge.dart';
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
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              // Soft, diffused drop shadow matching the new design language
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 15,
                spreadRadius: 0,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
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
    return Wrap(
      spacing: 8,
      runSpacing: 4,
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text(
          shipmentId,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: AppTheme.primaryBlue,
            fontWeight: FontWeight.bold,
            fontSize: isSmallScreen ? 12 : 14,
          ),
        ),
        StatusBadge(status: status),
      ],
    );
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
              elevation: 1, // tap/hover handles elevation internally in M3
              padding: EdgeInsets.symmetric(
                horizontal: isSmallScreen ? 4 : 8,
                vertical: 0,
              ),
              minimumSize: Size(0, buttonHeight),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
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
                borderRadius: BorderRadius.circular(12),
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
