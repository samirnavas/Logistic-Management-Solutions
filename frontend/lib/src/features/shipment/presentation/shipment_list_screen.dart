import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/app_drawer.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/shipment/data/mock_shipment_repository.dart';
import 'package:bb_logistics/src/features/shipment/presentation/widgets/shipment_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ShipmentListScreen extends ConsumerStatefulWidget {
  const ShipmentListScreen({super.key});

  @override
  ConsumerState<ShipmentListScreen> createState() => _ShipmentListScreenState();
}

class _ShipmentListScreenState extends ConsumerState<ShipmentListScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    // Watch the shipment list provider
    final shipmentsAsync = ref.watch(shipmentListProvider);

    return BlueBackgroundScaffold(
      scaffoldKey: _scaffoldKey,
      drawer: const AppDrawer(),
      body: Stack(
        children: [
          // 1. Scrollable Content (FIRST in stack - at bottom)
          Positioned.fill(
            child: RefreshIndicator(
              onRefresh: () async {
                HapticFeedback.lightImpact();
                await ref.refresh(shipmentListProvider.future);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    SizedBox(height: MediaQuery.of(context).padding.top + 70),
                    Container(
                      width: double.infinity,
                      constraints: BoxConstraints(
                        minHeight:
                            MediaQuery.of(context).size.height -
                            MediaQuery.of(context).padding.top -
                            70,
                      ),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(30),
                          topRight: Radius.circular(30),
                        ),
                      ),
                      padding: EdgeInsets.all(
                        MediaQuery.of(context).size.width < 380 ? 16 : 20,
                      ),
                      child: shipmentsAsync.when(
                        // Loading State
                        loading: () => const Padding(
                          padding: EdgeInsets.only(top: 100),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: AppTheme.primaryBlue,
                            ),
                          ),
                        ),

                        // Error State
                        error: (error, stackTrace) => Padding(
                          padding: const EdgeInsets.only(top: 100),
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.error_outline,
                                  size: 60,
                                  color: Colors.red[300],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Something went wrong',
                                  style: Theme.of(context).textTheme.bodyLarge
                                      ?.copyWith(color: Colors.grey[600]),
                                ),
                                const SizedBox(height: 8),
                                TextButton(
                                  onPressed: () {
                                    HapticFeedback.lightImpact();
                                    ref.invalidate(shipmentListProvider);
                                  },
                                  child: const Text('Try Again'),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Data State
                        data: (shipments) {
                          if (shipments.isEmpty) {
                            // Empty State
                            return Center(
                              child: Padding(
                                padding: const EdgeInsets.only(top: 50),
                                child: Column(
                                  children: [
                                    Icon(
                                      Icons.local_shipping_outlined,
                                      size: 80,
                                      color: Colors.grey[300],
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      'No shipments found',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyLarge
                                          ?.copyWith(color: Colors.grey[500]),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }

                          // Shipment List
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Your Shipments',
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textDark,
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${shipments.length} active shipments',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(color: Colors.grey[500]),
                              ),
                              const SizedBox(height: 16),
                              // Build shipment cards
                              ...shipments.map(
                                (shipment) => ShipmentCard(
                                  shipmentId: shipment.trackingNumber,
                                  boxId:
                                      '${shipment.packageCount} Box${shipment.packageCount != 1 ? 'es' : ''}',
                                  status: shipment.status,
                                  type: shipment.mode,
                                  date:
                                      '${shipment.estimatedDelivery.day}/${shipment.estimatedDelivery.month}/${shipment.estimatedDelivery.year}',
                                  product:
                                      '${shipment.origin} → ${shipment.destination}',
                                  updated: _getTimeAgo(
                                    shipment.estimatedDelivery,
                                  ),
                                  onTrack: () {
                                    HapticFeedback.lightImpact();
                                    context.push(
                                      '/tracking/${shipment.trackingNumber}',
                                    );
                                  },
                                  onViewDetails: () {
                                    HapticFeedback.lightImpact();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Shipment details coming soon',
                                        ),
                                      ),
                                    );
                                  },
                                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
                              ),
                              const SizedBox(height: 20),
                            ],
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 2. Custom App Bar (LAST in stack - on top for touch events)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Menu Icon
                    IconButton(
                      icon: const Icon(
                        Icons.menu,
                        color: Colors.white,
                        size: 28,
                      ),
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        _scaffoldKey.currentState?.openDrawer();
                      },
                    ),
                    Text(
                      'Shipments',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontSize: 20,
                      ),
                    ),
                    // Notification Icon
                    Container(
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                      ),
                      child: IconButton(
                        icon: const Icon(
                          Icons.notifications_none_outlined,
                          color: AppTheme.primaryBlue,
                        ),
                        onPressed: () {
                          HapticFeedback.lightImpact();
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Helper to generate a realistic "time ago" string
  String _getTimeAgo(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(now);

    if (difference.isNegative) {
      // Already delivered
      final daysPast = difference.inDays.abs();
      if (daysPast == 0) return 'Delivered today';
      if (daysPast == 1) return 'Delivered yesterday';
      return 'Delivered $daysPast days ago';
    } else {
      // In future
      final daysAhead = difference.inDays;
      if (daysAhead == 0) return 'Arriving today';
      if (daysAhead == 1) return 'Arriving tomorrow';
      return 'In $daysAhead days';
    }
  }
}
