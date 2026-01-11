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
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            offset: const Offset(0, 4),
            blurRadius: 12,
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left Image
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: 80,
                height: 80,
                color: Colors.grey[200],
                // Placeholder for the box image
                child: const Icon(
                  Icons.inventory_2_outlined,
                  color: Colors.grey,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Right Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header: ID and Status
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '$shipmentId - On the way',
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(
                                color: AppTheme.primaryBlue,
                                fontWeight: FontWeight.bold,
                              ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE3F2FD),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          status,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: AppTheme.primaryBlue,
                                fontWeight: FontWeight.w500,
                              ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Details Grid
                  _buildDetailRow(context, 'Box No:', boxId),
                  _buildDetailRow(context, 'Updated:', updated),
                  _buildDetailRow(context, 'Product:', product),
                  _buildDetailRow(context, 'Shipment Mode:', '$type Freight'),
                  _buildDetailRow(context, 'Expected Delivery:', date),
                  const SizedBox(height: 12),
                  // Buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: onTrack,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryBlue,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 0),
                            minimumSize: const Size(0, 32),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                          ),
                          child: Text(
                            'Track Shipment',
                            style: Theme.of(context).textTheme.labelMedium
                                ?.copyWith(color: Colors.white),
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
                            padding: const EdgeInsets.symmetric(vertical: 0),
                            minimumSize: const Size(0, 32),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                          ),
                          child: Text(
                            'View Details',
                            style: Theme.of(context).textTheme.labelMedium
                                ?.copyWith(color: AppTheme.primaryBlue),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[500],
              fontSize: 11,
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.black87,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
