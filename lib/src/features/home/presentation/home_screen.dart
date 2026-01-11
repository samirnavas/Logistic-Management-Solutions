import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/shipment/presentation/widgets/shipment_card.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlueBackgroundScaffold(
      body: Stack(
        children: [
          // 1. Custom App Bar Content (Menu, Bell)
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
                      onPressed: () {},
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

          // 2. Scrollable Layer
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
                    padding: const EdgeInsets.fromLTRB(20, 30, 20, 100),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Greeting
                        Text(
                          'Hello, John!',
                          style: Theme.of(context).textTheme.displayMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Track, manage, and review all your shipments in one place.',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppTheme.textGrey, height: 1.5),
                        ),
                        const SizedBox(height: 24),

                        // Customer Code Card
                        _buildCustomerCodeCard(context),

                        const SizedBox(height: 16),

                        // "Create New Request" Button (Right Aligned)
                        Align(
                          alignment: Alignment.centerRight,
                          child: ElevatedButton.icon(
                            onPressed: () => context.push('/create-request'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryBlue,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24),
                              ),
                              elevation: 0,
                            ),
                            icon: const Icon(Icons.add, size: 18),
                            label: const Text('CREATE NEW REQUEST'),
                          ),
                        ),

                        const SizedBox(height: 32),

                        // Status Overview
                        Text(
                          'Status Overview',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 16),
                        _buildStatusGrid(context),

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
                        ),
                        const SizedBox(height: 8),
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: 2,
                          itemBuilder: (context, index) {
                            return ShipmentCard(
                              shipmentId: '#RQ1982',
                              boxId: 'BX-221',
                              status: 'Transit',
                              type: 'Air',
                              date: '26 Dec 2025',
                              onTrack: () {},
                              onViewDetails: () {},
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 20),
        child: FloatingActionButton.extended(
          onPressed: () {},
          backgroundColor: AppTheme.surface,
          elevation: 4,
          icon: const Icon(Icons.chat_bubble, color: AppTheme.primaryGreen),
          label: Text(
            'Open Chat',
            style: Theme.of(
              context,
            ).textTheme.labelLarge?.copyWith(color: AppTheme.textDark),
          ),
        ),
      ),
    );
  }

  Widget _buildCustomerCodeCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
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
            'ABC12345',
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

  Widget _buildStatusGrid(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 0.85,
      children: [
        _buildStatusCard(
          context,
          'Requests',
          '12',
          Icons.assignment_outlined,
          AppTheme.primaryBlue.withValues(alpha: 0.1),
          AppTheme.primaryBlue,
        ),
        _buildStatusCard(
          context,
          'Shipped',
          '08',
          Icons.directions_boat_outlined,
          AppTheme.primaryCyan.withValues(alpha: 0.1),
          AppTheme.primaryCyan,
        ),
        _buildStatusCard(
          context,
          'Delivered',
          '06',
          Icons.check_circle_outlined,
          Colors.orange.withValues(alpha: 0.1),
          Colors.orange,
        ),
        _buildStatusCard(
          context,
          'Cleared',
          '02',
          Icons.verified_user_outlined,
          AppTheme.primaryGreen.withValues(alpha: 0.1),
          AppTheme.primaryGreen,
        ),
        _buildStatusCard(
          context,
          'Dispatch',
          '01',
          Icons.local_shipping_outlined,
          Colors.green.withValues(alpha: 0.1),
          Colors.green,
        ),
        _buildStatusCard(
          context,
          'Waiting',
          '00',
          Icons.schedule_outlined,
          Colors.purple.withValues(alpha: 0.1),
          Colors.purple,
        ),
      ],
    );
  }

  Widget _buildStatusCard(
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
