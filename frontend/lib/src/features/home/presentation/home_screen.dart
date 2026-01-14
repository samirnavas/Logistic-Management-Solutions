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
import 'package:flutter_animate/flutter_animate.dart';

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
            child: SingleChildScrollView(
              child: Column(
                children: [
                  SizedBox(
                    height: MediaQuery.of(context).padding.top + 70,
                  ), // Dynamic top margin
                  Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(30),
                        topRight: Radius.circular(30),
                      ),
                    ),
                    padding: EdgeInsets.fromLTRB(
                      MediaQuery.of(context).size.width < 380 ? 16 : 20,
                      30,
                      MediaQuery.of(context).size.width < 380 ? 16 : 20,
                      100,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Greeting
                        Text(
                              'Hello, ${user?.fullName ?? 'Guest'}!',
                              style: Theme.of(context).textTheme.displayMedium,
                            )
                            .animate()
                            .fadeIn(duration: 500.ms)
                            .slideX(begin: -0.2, end: 0),
                        const SizedBox(height: 8),
                        Text(
                          'Track, manage, and review all your shipments in one place.',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppTheme.textGrey, height: 1.5),
                        ).animate().fadeIn(delay: 100.ms, duration: 500.ms),
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

                        // Pass statsAsync instead of shipmentsAsync to _buildStatusGrid
                        // But we also need to keep shipmentsAsync for the list below.
                        statsAsync.when(
                          data: (stats) => _buildStatusGrid(context, stats),
                          loading: () =>
                              const Center(child: CircularProgressIndicator()),
                          error: (e, s) => Text('Error loading status: $e'),
                        ),

                        const SizedBox(height: 32),

                        // Recent Shipments
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Recent Shipments',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            TextButton(
                              onPressed: () {},
                              child: Text(
                                'View All >',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(
                                      color: AppTheme.primaryBlue,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ),
                          ],
                        ).animate().fadeIn(delay: 600.ms),
                        const SizedBox(height: 8),

                        shipmentsAsync.when(
                          data: (shipments) {
                            if (shipments.isEmpty) {
                              return const Text("No recent shipments");
                            }
                            final recent = shipments.take(2).toList();
                            return ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: recent.length,
                              itemBuilder: (context, index) {
                                final s = recent[index];
                                return ShipmentCard(
                                      shipmentId: s.trackingNumber,
                                      boxId:
                                          '${s.packageCount} Box${s.packageCount != 1 ? 'es' : ''}',
                                      status: s.status,
                                      type: s.mode,
                                      product: '${s.origin} → ${s.destination}',
                                      date:
                                          '${s.estimatedDelivery.day} ${_getMonthName(s.estimatedDelivery.month)} ${s.estimatedDelivery.year}',
                                      onTrack: () => context.push(
                                        '/tracking/${s.trackingNumber}',
                                      ),
                                      onViewDetails: () {},
                                    )
                                    .animate()
                                    .fadeIn(delay: (700 + (index * 100)).ms)
                                    .slideY(begin: 0.2, end: 0);
                              },
                            );
                          },
                          loading: () =>
                              const Center(child: CircularProgressIndicator()),
                          error: (e, s) => Text('Error loading shipments: $e'),
                        ),
                      ],
                    ),
                  ),
                ],
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
                        onPressed: () {},
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
          child: FloatingActionButton.extended(
            onPressed: () => context.push('/request-shipment'),
            backgroundColor: AppTheme.primaryBlue,
            elevation: 6,
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
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
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
        ],
      ),
    );
  }

  Widget _buildStatusGrid(BuildContext context, DashboardStats stats) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Responsive grid: 2 columns on small screens, 3 on larger
        final crossAxisCount = constraints.maxWidth < 350 ? 2 : 3;
        final aspectRatio = constraints.maxWidth < 350 ? 1.0 : 0.82;

        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: aspectRatio,
          children: [
            _buildStatusItem(
              context,
              'Requests',
              '${stats.requests}',
              Icons.assignment_outlined,
              AppTheme.primaryBlue.withValues(alpha: 0.1),
              AppTheme.primaryBlue,
            ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.2, end: 0),
            _buildStatusItem(
              context,
              'Shipped',
              '${stats.shipped}',
              Icons.local_shipping_outlined,
              Colors.indigo.withValues(alpha: 0.1),
              Colors.indigo,
            ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
            _buildStatusItem(
              context,
              'Delivered',
              '${stats.delivered}',
              Icons.check_circle_outlined,
              Colors.green.withValues(alpha: 0.1),
              Colors.green,
            ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2, end: 0),
            _buildStatusItem(
              context,
              'Cleared',
              '${stats.cleared}',
              Icons.verified_user_outlined,
              Colors.teal.withValues(alpha: 0.1),
              Colors.teal,
            ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2, end: 0),
            _buildStatusItem(
              context,
              'Dispatch',
              '${stats.dispatch}',
              Icons.send_outlined,
              Colors.orange.withValues(alpha: 0.1),
              Colors.orange,
            ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.2, end: 0),
            _buildStatusItem(
              context,
              'Waiting',
              '${stats.waiting}',
              Icons.access_time,
              Colors.red.withValues(alpha: 0.1),
              Colors.red,
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
    return Container(
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
    );
  }
}
