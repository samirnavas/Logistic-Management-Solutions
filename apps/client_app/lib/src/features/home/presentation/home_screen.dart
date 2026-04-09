import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/app_drawer.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:bb_logistics/src/features/auth/domain/user.dart';
import 'package:bb_logistics/src/features/home/data/dashboard_repository.dart';
import 'package:bb_logistics/src/features/home/domain/dashboard_stats.dart';
import 'package:bb_logistics/src/features/shipment/data/mock_shipment_repository.dart';
import 'package:bb_logistics/src/features/shipment/domain/shipment.dart';
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
          Positioned.fill(
            child: RefreshIndicator(
              onRefresh: () async {
                HapticFeedback.lightImpact();
                await Future.wait([
                  ref.refresh(dashboardStatsProvider.future),
                  ref.refresh(shipmentListProvider.future),
                ]);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    SizedBox(height: MediaQuery.of(context).padding.top + 70),
                    Container(
                      width: double.infinity,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFAF8FF),
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(24),
                          topRight: Radius.circular(24),
                        ),
                      ),
                      padding: const EdgeInsets.fromLTRB(20, 24, 20, 120),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildGreetingHeader(context, authState, user),
                          const SizedBox(height: 28),
                          Text(
                            'Status Overview',
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(
                                  color: const Color(0xFF2F3036),
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 14),
                          statsAsync.when(
                            data: (stats) => _buildStatusGrid(context, stats),
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
                          const SizedBox(height: 28),
                          _buildRecentHeader(context),
                          const SizedBox(height: 12),
                          shipmentsAsync.when(
                            data: (shipments) {
                              if (shipments.isEmpty) {
                                return _buildEmptyShipmentsState(context);
                              }
                              final recent = shipments.take(2).toList();
                              return ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: recent.length,
                                separatorBuilder: (_, _) =>
                                    const SizedBox(height: 12),
                                itemBuilder: (context, index) =>
                                    _buildRecentRequestCard(
                                      context,
                                      recent[index],
                                    ).animate().fadeIn(
                                          delay: (300 + (index * 120)).ms,
                                        ),
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
                    ),
                  ],
                ),
              ),
            ),
          ),

          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        _scaffoldKey.currentState?.openDrawer();
                      },
                      child: const Padding(
                        padding: EdgeInsets.all(8),
                        child: Icon(Icons.menu, color: Colors.white, size: 26),
                      ),
                    ),
                    Text(
                      'B&B Logistics',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.notifications_none_outlined,
                              color: Color(0xFF3250A2),
                              size: 20,
                            ),
                            onPressed: () {
                              HapticFeedback.lightImpact();
                            },
                          ),
                          Positioned(
                            top: -1,
                            right: -1,
                            child: Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: const Color(0xFF633000),
                                border: Border.all(
                                  color: const Color(0xFF3250A2),
                                  width: 1.2,
                                ),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ],
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
        padding: const EdgeInsets.only(bottom: 8),
        child: SizedBox(
          width: MediaQuery.of(context).size.width * 0.76,
          height: 56,
          child: FloatingActionButton.extended(
            onPressed: () {
              HapticFeedback.mediumImpact();
              context.push('/request-shipment');
            },
            backgroundColor: const Color(0xFF3250A2),
            elevation: 0,
            highlightElevation: 0,
            hoverElevation: 0,
            focusElevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(999),
            ),
            icon: const Icon(Icons.add, color: Colors.white, size: 22),
            label: Text(
              'CREATE NEW REQUEST',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
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

  Widget _buildGreetingHeader(
    BuildContext context,
    AsyncValue<User?> authState,
    User? user,
  ) {
    final customerCode = (user?.customerCode ?? '').trim().isNotEmpty
        ? user!.customerCode.trim()
        : 'N/A';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: authState.when(
                data: (userData) => Text(
                  'Hello, ${userData?.fullName ?? 'Guest'}!',
                  style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    fontSize: 30,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.2,
                  ),
                ),
                loading: () => Shimmer.fromColors(
                  baseColor: Colors.grey[300]!,
                  highlightColor: Colors.grey[100]!,
                  child: Container(
                    width: 200,
                    height: 34,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                error: (_, __) => Text(
                  'Hello, Guest!',
                  style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    fontSize: 30,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            _buildCustomerCodeCard(context, customerCode),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Track, manage, and review all your shipment requests in one place.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: const Color(0xFF444651),
            height: 1.45,
          ),
        ),
      ],
    );
  }

  Widget _buildCustomerCodeCard(BuildContext context, String code) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFE8E7EF),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFC4C6D3).withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            code,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1A1B21),
            ),
          ),
          const SizedBox(width: 6),
          IconButton(
            constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
            splashRadius: 16,
            padding: EdgeInsets.zero,
            onPressed: () async {
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
            icon: const Icon(
              Icons.content_copy,
              size: 16,
              color: Color(0xFF3250A2),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Recent Requests',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w700,
            color: const Color(0xFF1A1B21),
          ),
        ),
        Material(
          color: const Color(0xFFE3E2E9),
          borderRadius: BorderRadius.circular(999),
          child: InkWell(
            onTap: () {
              HapticFeedback.lightImpact();
              context.go('/requests');
            },
            borderRadius: BorderRadius.circular(999),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View All',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF214193),
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(
                    Icons.chevron_right,
                    size: 16,
                    color: Color(0xFF214193),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentRequestCard(BuildContext context, Shipment shipment) {
    final status = shipment.status.toString().trim();
    final statusLower = status.toLowerCase();
    final isInTransit = statusLower.contains('transit') || statusLower.contains('ship');
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFC4C6D3).withValues(alpha: 0.25)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF131B2E).withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          context.push('/tracking/${shipment.trackingNumber}');
        },
        borderRadius: BorderRadius.circular(14),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tracking Number',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        fontSize: 10,
                        letterSpacing: 0.6,
                        color: const Color(0xFF444651),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '#${shipment.trackingNumber}',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isInTransit
                        ? const Color(0xFFCCD6FD)
                        : const Color(0xFFE8E7EF),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    status,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isInTransit
                          ? const Color(0xFF525C7E)
                          : const Color(0xFF444651),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (isInTransit) ...[
              Row(
                children: [
                  _buildRouteNode(Icons.hub, context),
                  Expanded(
                    child: Container(
                      height: 2,
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                      color: const Color(0xFFC4C6D3).withValues(alpha: 0.55),
                    ),
                  ),
                  _buildRouteNode(Icons.location_on_outlined, context),
                ],
              ),
              const SizedBox(height: 12),
            ],
            Row(
              children: [
                Expanded(
                  child: _buildMeta(context, 'Route', '${shipment.origin} → ${shipment.destination}'),
                ),
                Expanded(
                  child: _buildMeta(
                    context,
                    'Packages',
                    '${shipment.packageCount} Item${shipment.packageCount == 1 ? '' : 's'}',
                    alignEnd: true,
                  ),
                ),
                Expanded(
                  child: _buildMeta(
                    context,
                    'Date',
                    '${shipment.estimatedDelivery.day} ${_getMonthName(shipment.estimatedDelivery.month)} ${shipment.estimatedDelivery.year}',
                    alignEnd: true,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteNode(IconData icon, BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: Color(0xFFE8E7EF),
      ),
      child: Icon(icon, size: 16, color: const Color(0xFF3250A2)),
    );
  }

  Widget _buildMeta(
    BuildContext context,
    String label,
    String value, {
    bool alignEnd = false,
  }) {
    return Column(
      crossAxisAlignment: alignEnd
          ? CrossAxisAlignment.end
          : CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            fontSize: 10,
            color: const Color(0xFF444651),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1A1B21),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusGrid(BuildContext context, DashboardStats stats) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1,
      children: [
        _buildStatusItem(context, 'Requests', '${stats.requests}', Icons.pending_actions),
        _buildStatusItem(context, 'Shipped', '${stats.shipped}', Icons.local_shipping_outlined),
        _buildStatusItem(context, 'Delivered', '${stats.delivered}', Icons.check_circle_outline),
        _buildStatusItem(context, 'Cleared', '${stats.cleared}', Icons.verified_user_outlined),
        _buildStatusItem(context, 'Dispatch', '${stats.dispatch}', Icons.departure_board_outlined),
        _buildStatusItem(context, 'Waiting', '${stats.waiting}', Icons.hourglass_empty_outlined),
      ],
    );
  }

  Widget _buildStatusItem(
    BuildContext context,
    String label,
    String count,
    IconData icon,
  ) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF4F3FA),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFC4C6D3).withValues(alpha: 0.2)),
        ),
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: const Color(0xFF3250A2).withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 16, color: const Color(0xFF3250A2)),
            ),
            const SizedBox(height: 6),
            Text(
              count,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              label.toUpperCase(),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: const Color(0xFF444651),
                fontSize: 9,
                letterSpacing: 0.7,
              ),
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
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.grey.withValues(alpha: 0.1),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 15,
                  spreadRadius: 0,
                  offset: const Offset(0, 4),
                ),
              ],
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
