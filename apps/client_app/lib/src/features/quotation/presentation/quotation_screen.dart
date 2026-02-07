import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/app_drawer.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/quotation/data/quotation_repository.dart';
import 'package:bb_logistics/src/features/quotation/domain/quotation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

class QuotationScreen extends ConsumerStatefulWidget {
  const QuotationScreen({super.key});

  @override
  ConsumerState<QuotationScreen> createState() => _QuotationScreenState();
}

/// Sort options for quotations
enum QuotationSortOption {
  dateNewest('Date (Newest)', Icons.calendar_today_outlined),
  dateOldest('Date (Oldest)', Icons.calendar_today_outlined),
  statusProgress('Status', Icons.flag_outlined),
  amountHigh('Amount (High to Low)', Icons.trending_up),
  amountLow('Amount (Low to High)', Icons.trending_down);

  final String label;
  final IconData icon;
  const QuotationSortOption(this.label, this.icon);
}

class _QuotationScreenState extends ConsumerState<QuotationScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  QuotationSortOption _selectedSort = QuotationSortOption.dateNewest;

  /// Sort quotations based on selected option
  List<Quotation> _sortQuotations(List<Quotation> quotations) {
    final sorted = List<Quotation>.from(quotations);

    switch (_selectedSort) {
      case QuotationSortOption.dateNewest:
        sorted.sort((a, b) => b.createdDate.compareTo(a.createdDate));
        break;
      case QuotationSortOption.dateOldest:
        sorted.sort((a, b) => a.createdDate.compareTo(b.createdDate));
        break;
      case QuotationSortOption.statusProgress:
        // Sort by status workflow order
        sorted.sort(
          (a, b) =>
              _getStatusOrder(a.status).compareTo(_getStatusOrder(b.status)),
        );
        break;
      case QuotationSortOption.amountHigh:
        sorted.sort((a, b) => b.totalAmount.compareTo(a.totalAmount));
        break;
      case QuotationSortOption.amountLow:
        sorted.sort((a, b) => a.totalAmount.compareTo(b.totalAmount));
        break;
    }

    return sorted;
  }

  /// Get order number for status (for sorting)
  int _getStatusOrder(QuotationStatus status) {
    switch (status) {
      case QuotationStatus.draft:
        return -1; // Drafts come first
      case QuotationStatus.requestSent:
        return 0;
      case QuotationStatus.approved:
        return 1;
      case QuotationStatus.detailsSubmitted:
        return 2;
      case QuotationStatus.costCalculated:
        return 3;
      case QuotationStatus.sent:
        return 4;
      case QuotationStatus.accepted:
        return 5;
      case QuotationStatus.readyForPickup:
        return 6;
      case QuotationStatus.shipped:
        return 7;
      case QuotationStatus.delivered:
        return 8;
      case QuotationStatus.rejected:
        return 9;
      case QuotationStatus.infoRequired:
        return 10;
    }
  }

  @override
  Widget build(BuildContext context) {
    final quotationsAsync = ref.watch(quotationsProvider);

    return BlueBackgroundScaffold(
      scaffoldKey: _scaffoldKey,
      drawer: const AppDrawer(),
      body: Stack(
        children: [
          // 1. Scrollable Content (MOVED FIRST to be at bottom of stack)
          Positioned.fill(
            child: RefreshIndicator(
              onRefresh: () async {
                HapticFeedback.lightImpact();
                // ignore: unused_result
                await ref.refresh(quotationsProvider.future);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
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
                      padding: EdgeInsets.fromLTRB(
                        MediaQuery.of(context).size.width < 380 ? 16 : 20,
                        30,
                        MediaQuery.of(context).size.width < 380 ? 16 : 20,
                        20,
                      ),
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
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
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

                              // Apply sorting
                              final sortedQuotations = _sortQuotations(
                                quotations,
                              );

                              return ListView.separated(
                                physics: const NeverScrollableScrollPhysics(),
                                shrinkWrap: true,
                                padding: EdgeInsets.zero,
                                itemCount: sortedQuotations.length,
                                separatorBuilder: (context, index) =>
                                    const SizedBox(height: 12),
                                itemBuilder: (context, index) {
                                  final quotation = sortedQuotations[index];
                                  return _QuotationCard(quotation: quotation)
                                      .animate()
                                      .fadeIn(delay: (100 * index).ms)
                                      .slideX();
                                },
                              );
                            },
                            loading: () => const Center(
                              child: Padding(
                                padding: EdgeInsets.all(40.0),
                                child: CircularProgressIndicator(),
                              ),
                            ),
                            error: (error, stack) => _buildErrorState(
                              context,
                              'Error loading quotations',
                              () {
                                ref.invalidate(quotationsProvider);
                              },
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
          ),

          // 2. Custom App Bar Content (Menu, Bell) - MOVED LAST to be receiving touches
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

  // Helper method for Sort Dropdown
  Widget _buildSortDropdown(BuildContext context) {
    return PopupMenuButton<QuotationSortOption>(
      onSelected: (option) {
        HapticFeedback.lightImpact();
        setState(() {
          _selectedSort = option;
        });
      },
      offset: const Offset(0, 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      itemBuilder: (context) => QuotationSortOption.values.map((option) {
        final isSelected = option == _selectedSort;
        return PopupMenuItem<QuotationSortOption>(
          value: option,
          child: Row(
            children: [
              Icon(
                option.icon,
                size: 18,
                color: isSelected ? AppTheme.primaryBlue : Colors.grey[600],
              ),
              const SizedBox(width: 12),
              Text(
                option.label,
                style: TextStyle(
                  color: isSelected ? AppTheme.primaryBlue : Colors.grey[800],
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
              if (isSelected) ...[
                const Spacer(),
                const Icon(Icons.check, size: 18, color: AppTheme.primaryBlue),
              ],
            ],
          ),
        );
      }).toList(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppTheme.background,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: AppTheme.primaryBlue.withValues(alpha: 0.2),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(_selectedSort.icon, size: 16, color: AppTheme.primaryBlue),
            const SizedBox(width: 8),
            Text(
              _selectedSort.label.split(' ').first, // Show just the first word
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.primaryBlue,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(
              Icons.keyboard_arrow_down,
              size: 18,
              color: AppTheme.primaryBlue,
            ),
          ],
        ),
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

    // Get screen width for responsive layout
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenWidth < 400;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.background.withValues(alpha: 0.5)),
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
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            HapticFeedback.lightImpact();
            if (quotation.status == QuotationStatus.approved) {
              context.push('/quotations/${quotation.id}/address');
            } else {
              context.push('/quotations/${quotation.id}');
            }
          },
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
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
                          Wrap(
                            children: [
                              Text(
                                'Quotation ID: ',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(color: AppTheme.textGrey),
                              ),
                              Text(
                                quotation.quotationId ?? quotation.id,
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
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: AppTheme.textGrey),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 12,
                            runSpacing: 8,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              _buildStatusChip(context),
                              quotation.status == QuotationStatus.requestSent ||
                                      quotation.status ==
                                          QuotationStatus.approved ||
                                      quotation.status ==
                                          QuotationStatus.detailsSubmitted
                                  ? Text(
                                      quotation.status ==
                                              QuotationStatus.approved
                                          ? 'Action Required - Add Address'
                                          : quotation.status ==
                                                QuotationStatus.detailsSubmitted
                                          ? 'Pending Price Calculation'
                                          : 'Calculated upon approval',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            color: AppTheme.textGrey,
                                            fontStyle: FontStyle.italic,
                                          ),
                                    )
                                  : Text(
                                      currencyFormat.format(
                                        quotation.totalAmount,
                                      ),
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
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

                    // View Button - only show on larger screens in the row
                    if (!isSmallScreen) _buildViewButton(context),
                  ],
                ),
                // View Button - show at bottom on small screens
                if (isSmallScreen) ...[
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: _buildViewButton(context),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildViewButton(BuildContext context) {
    return TextButton(
      onPressed: () {
        HapticFeedback.lightImpact();
        if (quotation.status == QuotationStatus.approved) {
          context.push('/quotations/${quotation.id}/address');
        } else {
          context.push('/quotations/${quotation.id}');
        }
      },
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'View',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: AppTheme.primaryBlue,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 2),
          const Icon(
            Icons.chevron_right,
            size: 18,
            color: AppTheme.primaryBlue,
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (quotation.status) {
      case QuotationStatus.draft:
        return Colors.grey;
      case QuotationStatus.costCalculated:
        return AppTheme.success;
      case QuotationStatus.sent:
        return AppTheme.success;
      case QuotationStatus.accepted:
        return Colors.green[800]!;
      case QuotationStatus.requestSent:
        return AppTheme.warning;
      case QuotationStatus.approved:
        return AppTheme.error; // Red to indicate action required
      case QuotationStatus.detailsSubmitted:
        return Colors.blueGrey;
      case QuotationStatus.rejected:
        return AppTheme.error;
      case QuotationStatus.readyForPickup:
        return AppTheme.primaryBlue;
      case QuotationStatus.shipped:
        return Colors.purple;
      case QuotationStatus.delivered:
        return Colors.green[800]!;
      case QuotationStatus.infoRequired:
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
        quotation.status == QuotationStatus.requestSent
            ? 'Request Sent'
            : quotation.status.displayName,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
