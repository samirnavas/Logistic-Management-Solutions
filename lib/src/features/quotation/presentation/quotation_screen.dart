import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/quotation/data/mock_quotation_repository.dart';
import 'package:bb_logistics/src/features/quotation/domain/quotation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class QuotationScreen extends ConsumerWidget {
  const QuotationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quotationsAsync = ref.watch(quotationsProvider);

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
                      onPressed: () {
                        // Scaffold.of(context).openDrawer();
                      },
                    ),
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
                        onPressed: () {},
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 2. Scrollable Content
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
                      color: Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(30),
                        topRight: Radius.circular(30),
                      ),
                    ),
                    padding: const EdgeInsets.fromLTRB(20, 30, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title and Filter
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Quotation',
                              style: Theme.of(context).textTheme.displaySmall,
                            ),
                            _buildSortDropdown(context),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // List Content
                        quotationsAsync.when(
                          data: (quotations) {
                            if (quotations.isEmpty) {
                              return Center(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 40,
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.description_outlined,
                                        size: 80,
                                        color: AppTheme.textGrey.withValues(
                                          alpha: 0.5,
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        'No quotations yet',
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyLarge
                                            ?.copyWith(
                                              color: AppTheme.textGrey,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }
                            return ListView.separated(
                              physics: const NeverScrollableScrollPhysics(),
                              shrinkWrap: true,
                              padding: EdgeInsets.zero,
                              itemCount: quotations.length,
                              separatorBuilder: (context, index) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final quotation = quotations[index];
                                return _QuotationCard(quotation: quotation);
                              },
                            );
                          },
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(40.0),
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          error: (error, stack) => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(20.0),
                              child: Text('Error loading quotations'),
                            ),
                          ),
                        ),
                        // Extra bottom padding for safe area
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Helper method for Sort Dropdown
  Widget _buildSortDropdown(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.calendar_today_outlined,
            size: 16,
            color: Colors.grey[600],
          ),
          const SizedBox(width: 8),
          Text(
            'Date',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey[800]),
          ),
          const SizedBox(width: 4),
          Icon(Icons.keyboard_arrow_down, size: 18, color: Colors.grey[600]),
        ],
      ),
    );
  }
}

class _QuotationCard extends StatelessWidget {
  final Quotation quotation;

  const _QuotationCard({required this.quotation});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy');
    final currencyFormat = NumberFormat.currency(
      symbol: '\$',
      decimalDigits: 2,
    );

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.background.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.textDark.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => context.push('/quotations/${quotation.id}'),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                // Status Indicator
                Container(
                  width: 4,
                  height: 60,
                  decoration: BoxDecoration(
                    color: _getStatusColor(),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Quotation ID: ',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(color: AppTheme.textGrey),
                          ),
                          Text(
                            quotation.id,
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: AppTheme.primaryBlue,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Created on: ${dateFormat.format(quotation.createdDate)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textGrey,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _buildStatusChip(context),
                          const SizedBox(width: 12),
                          Text(
                            currencyFormat.format(quotation.totalAmount),
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  color: AppTheme.primaryBlue,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // View Button
                TextButton(
                  onPressed: () => context.push('/quotations/${quotation.id}'),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'View Quotation',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: AppTheme.primaryBlue,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.chevron_right,
                        size: 18,
                        color: AppTheme.primaryBlue,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor() {
    switch (quotation.status) {
      case QuotationStatus.approved:
        return AppTheme.success;
      case QuotationStatus.pending:
        return AppTheme.warning;
      case QuotationStatus.rejected:
        return AppTheme.error;
    }
  }

  Widget _buildStatusChip(BuildContext context) {
    final color = _getStatusColor();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        quotation.status.displayName,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
