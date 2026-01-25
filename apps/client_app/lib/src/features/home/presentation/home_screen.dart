import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/app_drawer.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:bb_logistics/src/features/home/data/dashboard_repository.dart';
import 'package:bb_logistics/src/features/home/domain/dashboard_stats.dart';
import 'package:bb_logistics/src/features/shipment/data/mock_shipment_repository.dart';

import 'package:bb_logistics/src/features/shipment/presentation/widgets/shipment_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shimmer/shimmer.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    // Watch User Data
    final authState = ref.watch(authRepositoryProvider);
    final user = authState.valueOrNull;

    // Watch Shipment Data
    final shipmentsAsync = ref.watch(shipmentListProvider);
    // Watch Dashboard Stats
    final statsAsync = ref.watch(dashboardStatsProvider);

    return BlueBackgroundScaffold(
      scaffoldKey: _scaffoldKey,
      drawer: const AppDrawer(),
      body: Stack(
        children: [
          // 1. Scrollable Layer
          Positioned.fill(
            child: RefreshIndicator(
              onRefresh: () async {
                HapticFeedback.lightImpact();
                // Actually await the refresh of both providers
                await Future.wait([
                  ref.refresh(dashboardStatsProvider.future),
                  ref.refresh(shipmentListProvider.future),
                ]);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    SizedBox(
                      height: MediaQuery.of(context).padding.top + 70,
                    ), // Dynamic top margin
                    LayoutBuilder(
                      builder: (context, constraints) {
                        // Dynamic horizontal padding based on available width
                        final horizontalPadding = constraints.maxWidth < 360
                            ? 16.0
                            : constraints.maxWidth < 600
                            ? 20.0
                            : 24.0;

                        return Container(
                          width: double.infinity,
                          decoration: const BoxDecoration(
                            color: AppTheme.surface,
                            borderRadius: BorderRadius.only(
                              topLeft: Radius.circular(30),
                              topRight: Radius.circular(30),
                            ),
                          ),
                          padding: EdgeInsets.fromLTRB(
                            horizontalPadding,
                            30,
                            horizontalPadding,
                            100,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Greeting with shimmer loading state
                              authState.when(
                                data: (userData) =>
                                    Text(
                                          'Hello, ${userData?.fullName ?? 'Guest'}!',
                                          style: Theme.of(
                                            context,
                                          ).textTheme.displayMedium,
                                        )
                                        .animate()
                                        .fadeIn(duration: 500.ms)
                                        .slideX(begin: -0.2, end: 0),
                                loading: () => Shimmer.fromColors(
                                  baseColor: Colors.grey[300]!,
                                  highlightColor: Colors.grey[100]!,
                                  child: Container(
                                    width: 200,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                ),
                                error: (_, __) => Text(
                                  'Hello, Guest!',
                                  style: Theme.of(
                                    context,
                                  ).textTheme.displayMedium,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Track, manage, and review all your shipments in one place.',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(
                                      color: AppTheme.textGrey,
                                      height: 1.5,
                                    ),
                              ).animate().fadeIn(
                                delay: 100.ms,
                                duration: 500.ms,
                              ),
                              const SizedBox(height: 24),

                              // Customer Code Card
                              if (user != null)
                                _buildCustomerCodeCard(
                                      context,
                                      user.customerCode.isNotEmpty
                                          ? user.customerCode
                                          : 'N/A',
                                    )
                                    .animate()
                                    .fadeIn(delay: 200.ms, duration: 500.ms)
                                    .scale(),

                              const SizedBox(height: 16),

                              const SizedBox(height: 16),

                              // Status Overview
                              Text(
                                'Status Overview',
                                style: Theme.of(context).textTheme.titleLarge,
                              ).animate().fadeIn(delay: 400.ms),
                              const SizedBox(height: 16),

                              statsAsync.when(
                                data: (stats) =>
                                    _buildStatusGrid(context, stats),
                                loading: () => const Center(
                                  child: CircularProgressIndicator(),
                                ),
                                error: (e, s) => _buildErrorState(
                                  context,
                                  'Failed to load status',
                                  () {
                                    // ignore: unused_result
                                    ref.refresh(dashboardStatsProvider);
                                  },
                                ),
                              ),

                              const SizedBox(height: 32),

                              // Recent Shipments
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Flexible(
                                    child: Text(
                                      'Recent Shipments',
                                      style: Theme.of(
                                        context,
                                      ).textTheme.titleLarge,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Material(
                                    color: AppTheme.primaryBlue.withValues(
                                      alpha: 0.1,
                                    ),
                                    borderRadius: BorderRadius.circular(20),
                                    child: InkWell(
                                      onTap: () {
                                        HapticFeedback.lightImpact();
                                        context.go('/shipment');
                                      },
                                      borderRadius: BorderRadius.circular(20),
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 14,
                                          vertical: 8,
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              'View All',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color: AppTheme.primaryBlue,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                            ),
                                            const SizedBox(width: 4),
                                            const Icon(
                                              Icons.arrow_forward_ios,
                                              size: 12,
                                              color: AppTheme.primaryBlue,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ).animate().fadeIn(delay: 600.ms),
                              const SizedBox(height: 8),

                              shipmentsAsync.when(
                                data: (shipments) {
                                  if (shipments.isEmpty) {
                                    return _buildEmptyShipmentsState(context);
                                  }
                                  final recent = shipments.take(2).toList();
                                  return ListView.builder(
                                    shrinkWrap: true,
                                    physics:
                                        const NeverScrollableScrollPhysics(),
                                    itemCount: recent.length,
                                    itemBuilder: (context, index) {
                                      final s = recent[index];
                                      return ShipmentCard(
                                            shipmentId: s.trackingNumber,
                                            boxId:
                                                '${s.packageCount} Box${s.packageCount != 1 ? 'es' : ''}',
                                            status: s.status,
                                            type: s.mode,
                                            product:
                                                '${s.origin} → ${s.destination}',
                                            date:
                                                '${s.estimatedDelivery.day} ${_getMonthName(s.estimatedDelivery.month)} ${s.estimatedDelivery.year}',
                                            onTrack: () {
                                              HapticFeedback.lightImpact();
                                              context.push(
                                                '/tracking/${s.trackingNumber}',
                                              );
                                            },
                                            onViewDetails: () {
                                              HapticFeedback.lightImpact();
                                            },
                                          )
                                          .animate()
                                          .fadeIn(
                                            delay: (700 + (index * 100)).ms,
                                          )
                                          .slideY(begin: 0.2, end: 0);
                                    },
                                  );
                                },
                                loading: () => _buildShipmentSkeletonLoader(),
                                error: (e, s) => _buildErrorState(
                                  context,
                                  'Failed to load shipments',
                                  () {
                                    // ignore: unused_result
                                    ref.refresh(shipmentListProvider);
                                  },
                                ),
                              ),
                            ],
                          ),
                        ); // Close Container
                      }, // Close builder
                    ), // Close LayoutBuilder
                  ],
                ),
              ),
            ),
          ),

          // 2. Custom App Bar Content (Menu, Bell) - MOVED TO TOP to capture clicks
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
                    Container(
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.surface,
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
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 2),
        child: SizedBox(
          width: MediaQuery.of(context).size.width * 0.7,
          height: 48,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.08),
                  blurRadius: 12,
                  spreadRadius: 0,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.08),
                  blurRadius: 20,
                  spreadRadius: 2,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: FloatingActionButton.extended(
              onPressed: () {
                HapticFeedback.mediumImpact();
                context.push('/request-shipment');
              },
              backgroundColor: AppTheme.primaryBlue,
              elevation: 0,
              highlightElevation: 0,
              hoverElevation: 0,
              focusElevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
              ),
              icon: const Icon(
                Icons.add_circle_outline,
                color: Colors.white,
                size: 24,
              ),
              label: Text(
                'CREATE NEW REQUEST',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  String _getMonthName(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month - 1];
  }

  Widget _buildCustomerCodeCard(BuildContext context, String code) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
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
      child: Row(
        children: [
          Text(
            'Customer Code: ',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          Text(
            code,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
          const Spacer(),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () async {
                HapticFeedback.mediumImpact();
                await Clipboard.setData(ClipboardData(text: code));
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Customer code copied to clipboard'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                }
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Copy',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.primaryBlue,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusGrid(BuildContext context, DashboardStats stats) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Responsive grid configuration: 3 columns × 2 rows layout preferred
        final int crossAxisCount;
        final double aspectRatio;
        final double spacing;

        if (constraints.maxWidth < 240) {
          // Very narrow screens: fallback to 2 columns
          crossAxisCount = 2;
          aspectRatio = 1.1;
          spacing = 6.0;
        } else if (constraints.maxWidth < 320) {
          // Small screens: 3 columns, compact
          crossAxisCount = 3;
          aspectRatio = 0.9;
          spacing = 6.0;
        } else if (constraints.maxWidth < 400) {
          // Normal phones: 3 columns
          crossAxisCount = 3;
          aspectRatio = 1.0;
          spacing = 8.0;
        } else if (constraints.maxWidth < 600) {
          // Larger phones: 3 columns with more space
          crossAxisCount = 3;
          aspectRatio = 1.1;
          spacing = 10.0;
        } else {
          // Tablets and large screens: 3 columns with generous spacing
          crossAxisCount = 3;
          aspectRatio = 1.2;
          spacing = 14.0;
        }

        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: spacing,
          mainAxisSpacing: spacing,
          childAspectRatio: aspectRatio,
          children: [
            _buildStatusItem(
              context,
              'Requests',
              '${stats.requests}',
              Icons.assignment_outlined,
              AppTheme.statusRequests.withValues(alpha: 0.1),
              AppTheme.statusRequests,
            ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.2, end: 0),
            _buildStatusItem(
              context,
              'Shipped',
              '${stats.shipped}',
              Icons.local_shipping_outlined,
              AppTheme.statusShipped.withValues(alpha: 0.1),
              AppTheme.statusShipped,
            ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
            _buildStatusItem(
              context,
              'Delivered',
              '${stats.delivered}',
              Icons.check_circle_outlined,
              AppTheme.statusDelivered.withValues(alpha: 0.1),
              AppTheme.statusDelivered,
            ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2, end: 0),
            _buildStatusItem(
              context,
              'Cleared',
              '${stats.cleared}',
              Icons.verified_user_outlined,
              AppTheme.statusCleared.withValues(alpha: 0.1),
              AppTheme.statusCleared,
            ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2, end: 0),
            _buildStatusItem(
              context,
              'Dispatch',
              '${stats.dispatch}',
              Icons.send_outlined,
              AppTheme.statusDispatch.withValues(alpha: 0.1),
              AppTheme.statusDispatch,
            ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.2, end: 0),
            _buildStatusItem(
              context,
              'Waiting',
              '${stats.waiting}',
              Icons.access_time,
              AppTheme.statusWaiting.withValues(alpha: 0.1),
              AppTheme.statusWaiting,
            ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2, end: 0),
          ],
        );
      },
    );
  }

  Widget _buildStatusItem(
    BuildContext context,
    String label,
    String count,
    IconData icon,
    Color bgColor,
    Color iconColor,
  ) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        // Add navigation logic if needed
      },
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            // Subtle light blue glow for depth
            BoxShadow(
              color: AppTheme.primaryBlue.withValues(alpha: 0.06),
              blurRadius: 8,
              spreadRadius: 0,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppTheme.surface,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 16, color: iconColor),
            ),
            const SizedBox(height: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  count,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(label, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(
    BuildContext context,
    String message,
    VoidCallback onRetry,
  ) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, color: Colors.grey[400], size: 40),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppTheme.textGrey),
            ),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: () {
                HapticFeedback.lightImpact();
                onRetry();
              },
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.primaryBlue,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Builds a shimmer skeleton loader that mimics the shape of ShipmentCards
  Widget _buildShipmentSkeletonLoader() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Column(
        children: List.generate(2, (index) => _buildShipmentCardSkeleton()),
      ),
    );
  }

  /// Single shipment card skeleton
  Widget _buildShipmentCardSkeleton() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: ID and Status badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 120,
                height: 16,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              Container(
                width: 80,
                height: 24,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Middle row: Route info
          Container(
            width: double.infinity,
            height: 14,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: 150,
            height: 14,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 16),
          // Bottom row: Actions
          Row(
            children: [
              Container(
                width: 80,
                height: 32,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 100,
                height: 32,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Builds a proper empty state widget when there are no shipments
  Widget _buildEmptyShipmentsState(BuildContext context) {
    return Center(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
            decoration: BoxDecoration(
              color: AppTheme.background,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppTheme.textGrey.withValues(alpha: 0.2),
                width: 1,
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.local_shipping_outlined,
                    size: 40,
                    color: AppTheme.primaryBlue,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'No Shipments Yet',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textDark,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your recent shipments will appear here.\nCreate a new request to get started!',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textGrey,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 20),
                OutlinedButton.icon(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    context.push('/request-shipment');
                  },
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Create Request'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryBlue,
                    side: const BorderSide(color: AppTheme.primaryBlue),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
          ), // Close Container
        )
        .animate()
        .fadeIn(duration: 500.ms)
        .scale(begin: const Offset(0.95, 0.95)); // Close Center
  }
}
