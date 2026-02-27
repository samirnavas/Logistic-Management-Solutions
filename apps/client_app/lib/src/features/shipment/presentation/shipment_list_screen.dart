import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/app_drawer.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/shipment/data/mock_shipment_repository.dart';
import 'package:bb_logistics/src/features/shipment/presentation/widgets/shipment_card.dart';
import 'package:bb_logistics/src/features/quotation/domain/quotation.dart';
import 'package:bb_logistics/src/features/shipment/presentation/request_shipment_screen.dart';
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
                // ignore: unused_result
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
                        color: AppTheme.surface,
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
                        // Loading State
                        loading: () => Padding(
                          padding: const EdgeInsets.only(top: 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                    width: 150,
                                    height: 24,
                                    decoration: BoxDecoration(
                                      color: Colors.grey[200],
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  )
                                  .animate(
                                    onPlay: (controller) => controller.repeat(),
                                  )
                                  .shimmer(
                                    duration: 1200.ms,
                                    color: Colors.white54,
                                  ),
                              const SizedBox(height: 16),
                              ...List.generate(
                                3,
                                (index) => Padding(
                                  padding: const EdgeInsets.only(bottom: 16.0),
                                  child:
                                      Container(
                                            width: double.infinity,
                                            height: 160,
                                            decoration: BoxDecoration(
                                              color: Colors.grey[200],
                                              borderRadius:
                                                  BorderRadius.circular(16),
                                            ),
                                          )
                                          .animate(
                                            onPlay: (controller) =>
                                                controller.repeat(),
                                          )
                                          .shimmer(
                                            duration: 1200.ms,
                                            color: Colors.white54,
                                          ),
                                ),
                              ),
                            ],
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
                                    // ignore: unused_result
                                    ref.refresh(shipmentListProvider);
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
                                padding: const EdgeInsets.only(top: 40),
                                child:
                                    Column(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Container(
                                              width: 120,
                                              height: 120,
                                              decoration: BoxDecoration(
                                                color: AppTheme.primaryBlue
                                                    .withOpacity(0.05),
                                                shape: BoxShape.circle,
                                              ),
                                              child: Icon(
                                                Icons.inventory_2_outlined,
                                                size: 60,
                                                color: AppTheme.primaryBlue
                                                    .withOpacity(0.5),
                                              ),
                                            ),
                                            const SizedBox(height: 24),
                                            Text(
                                              'No Active Shipments',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleLarge
                                                  ?.copyWith(
                                                    color: AppTheme.textDark,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                            ),
                                            const SizedBox(height: 8),
                                            Text(
                                              'Get started by creating your first shipment request.',
                                              textAlign: TextAlign.center,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodyMedium
                                                  ?.copyWith(
                                                    color: Colors.grey[500],
                                                  ),
                                            ),
                                            const SizedBox(height: 32),
                                            ElevatedButton.icon(
                                              onPressed: () {
                                                HapticFeedback.lightImpact();
                                                context.push(
                                                  '/request-shipment',
                                                );
                                              },
                                              icon: const Icon(
                                                Icons.add,
                                                color: Colors.white,
                                              ),
                                              label: const Text(
                                                'Create First Shipment',
                                              ),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor:
                                                    AppTheme.primaryBlue,
                                                foregroundColor: Colors.white,
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 24,
                                                      vertical: 14,
                                                    ),
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(12),
                                                ),
                                                elevation: 2,
                                              ),
                                            ),
                                          ],
                                        )
                                        .animate()
                                        .fadeIn(duration: 400.ms)
                                        .slideY(begin: 0.1, end: 0),
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
                                  onViewDetails: () =>
                                      _handleShipmentTap(context, shipment),
                                  onTap: () =>
                                      _handleShipmentTap(context, shipment),
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

  void _handleShipmentTap(BuildContext context, dynamic shipment) {
    HapticFeedback.lightImpact();
    // Normalize status
    final status = shipment.status.toString().toUpperCase();

    if (status.contains('DRAFT') ||
        status.contains('INFO') ||
        status.contains('REQUIRED')) {
      // Navigate to RequestShipmentScreen (Edit Mode)
      // Map Shipment to Quotation (Best Effort)
      final quotation = _mapShipmentToQuotation(shipment);
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) =>
              RequestShipmentScreen(existingQuotation: quotation),
        ),
      );
    } else if (status.contains('QUOTATION') &&
        (status.contains('SENT') || status.contains('RECEIVED'))) {
      // Navigate to QuotationDetailScreen (Review Mode)
      context.push('/quotations/${shipment.id}');
    } else {
      // Navigate to TrackingScreen
      context.push('/tracking/${shipment.trackingNumber}');
    }
  }

  Quotation _mapShipmentToQuotation(dynamic shipment) {
    // create a best-effort Quotation object from Shipment
    // note: In a real app, you might want to fetch the full quotation by ID here
    return Quotation(
      id: shipment.id,
      quotationId: shipment.id, // fallback
      createdDate: shipment.createdAt,
      status: QuotationStatus
          .infoRequired, // Default to infoRequired for editing flow if unknown
      items: [], // Items are lost in summary view
      origin: QuotationAddress(
        addressLine: shipment.origin,
        name: 'Origin',
        phone: '',
        city: shipment.origin,
        country: '',
        state: '',
        zip: '',
      ),
      destination: QuotationAddress(
        addressLine: shipment.destination,
        name: 'Destination',
        phone: '',
        city: shipment.destination,
        country: '',
        state: '',
        zip: '',
      ),
      totalAmount: shipment.cost,
      cargoType: 'General Cargo',
      serviceType: 'Standard',
      specialInstructions: '',
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
