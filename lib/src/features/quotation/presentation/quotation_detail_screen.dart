import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';

import '../../../core/theme/theme.dart';
import '../data/mock_quotation_repository.dart';
import '../domain/quotation.dart';

class QuotationDetailScreen extends ConsumerStatefulWidget {
  final String quotationId;

  const QuotationDetailScreen({super.key, required this.quotationId});

  @override
  ConsumerState<QuotationDetailScreen> createState() =>
      _QuotationDetailScreenState();
}

class _QuotationDetailScreenState extends ConsumerState<QuotationDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _pdfPath;
  bool _pdfLoading = true;
  String? _pdfError;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadPdf();
  }

  Future<void> _loadPdf() async {
    try {
      // Try to load sample PDF from assets
      final bytes = await rootBundle.load('assets/sample_invoice.pdf');
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/sample_invoice.pdf');
      await file.writeAsBytes(bytes.buffer.asUint8List());
      setState(() {
        _pdfPath = file.path;
        _pdfLoading = false;
      });
    } catch (e) {
      setState(() {
        _pdfLoading = false;
        _pdfError = 'PDF not available';
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final quotationAsync = ref.watch(quotationByIdProvider(widget.quotationId));

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: _buildAppBar(context),
      body: quotationAsync.when(
        data: (quotation) {
          if (quotation == null) {
            return _buildNotFoundState(context);
          }
          return _buildContent(context, quotation);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => _buildErrorState(context, error),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      title: const Text('Quotation Details'),
      backgroundColor: AppTheme.primaryBlue,
      foregroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () => context.pop(),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.share_outlined),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Sharing coming soon...')),
            );
          },
        ),
        IconButton(
          icon: const Icon(Icons.download_outlined),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Download coming soon...')),
            );
          },
        ),
      ],
    );
  }

  Widget _buildNotFoundState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 80,
            color: AppTheme.neutralGray.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Quotation not found',
            style: AppTheme.textStyle16Medium.copyWith(
              color: AppTheme.neutralGray,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => context.pop(),
            child: const Text('Go Back'),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: AppTheme.errorRed.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Failed to load quotation',
            style: AppTheme.textStyle16Medium.copyWith(
              color: AppTheme.neutralGray,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () =>
                ref.invalidate(quotationByIdProvider(widget.quotationId)),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context, Quotation quotation) {
    return Column(
      children: [
        // Summary Header Card
        _buildSummaryCard(quotation),

        // Tab Bar
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _tabController,
            labelColor: AppTheme.primaryBlue,
            unselectedLabelColor: AppTheme.neutralGray,
            indicatorColor: AppTheme.primaryBlue,
            indicatorWeight: 3,
            tabs: const [
              Tab(text: 'Breakdown'),
              Tab(text: 'PDF View'),
            ],
          ),
        ),

        // Tab Content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [_buildBreakdownTab(quotation), _buildPdfTab()],
          ),
        ),

        // Bottom Action Buttons (only for pending quotations)
        if (quotation.status == QuotationStatus.pending)
          _buildActionButtons(context, quotation),
      ],
    );
  }

  Widget _buildSummaryCard(Quotation quotation) {
    final dateFormat = DateFormat('dd MMM yyyy');
    final currencyFormat = NumberFormat.currency(
      symbol: '\$',
      decimalDigits: 2,
    );

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primaryBlue,
            AppTheme.primaryBlue.withValues(alpha: 0.85),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryBlue.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Quotation ID',
                    style: AppTheme.textStyle12.copyWith(
                      color: Colors.white.withValues(alpha: 0.7),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    quotation.id,
                    style: AppTheme.textStyle16SemiBold.copyWith(
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              _buildStatusBadge(quotation.status),
            ],
          ),
          const SizedBox(height: 16),
          Container(height: 1, color: Colors.white.withValues(alpha: 0.2)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Request ID',
                    style: AppTheme.textStyle12.copyWith(
                      color: Colors.white.withValues(alpha: 0.7),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    quotation.requestId,
                    style: AppTheme.textStyle14Medium.copyWith(
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Created Date',
                    style: AppTheme.textStyle12.copyWith(
                      color: Colors.white.withValues(alpha: 0.7),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    dateFormat.format(quotation.createdDate),
                    style: AppTheme.textStyle14Medium.copyWith(
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Center(
            child: Column(
              children: [
                Text(
                  'Total Amount',
                  style: AppTheme.textStyle14.copyWith(
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  currencyFormat.format(quotation.totalAmount),
                  style: AppTheme.textStyle34SemiBold.copyWith(
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(QuotationStatus status) {
    Color badgeColor;
    switch (status) {
      case QuotationStatus.approved:
        badgeColor = AppTheme.successGreen;
        break;
      case QuotationStatus.pending:
        badgeColor = AppTheme.warningYellow;
        break;
      case QuotationStatus.rejected:
        badgeColor = AppTheme.errorRed;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: badgeColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            status.displayName,
            style: AppTheme.textStyle12SemiBold.copyWith(color: badgeColor),
          ),
        ],
      ),
    );
  }

  Widget _buildBreakdownTab(Quotation quotation) {
    final currencyFormat = NumberFormat.currency(
      symbol: '\$',
      decimalDigits: 2,
    );

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.neutralLightGray),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Itemized Breakdown', style: AppTheme.textStyle16SemiBold),
            const SizedBox(height: 16),

            // Header Row
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.backgroundLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Text(
                        'Description',
                        style: AppTheme.textStyle12SemiBold.copyWith(
                          color: AppTheme.neutralGray,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'Cost',
                        style: AppTheme.textStyle12SemiBold.copyWith(
                          color: AppTheme.neutralGray,
                        ),
                        textAlign: TextAlign.right,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Line Items
            ...quotation.items.map(
              (item) => _buildLineItem(item, currencyFormat),
            ),

            // Divider
            const SizedBox(height: 16),
            Container(
              height: 2,
              decoration: BoxDecoration(
                color: AppTheme.neutralLightGray,
                borderRadius: BorderRadius.circular(1),
              ),
            ),
            const SizedBox(height: 16),

            // Total Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total Amount', style: AppTheme.textStyle16SemiBold),
                Text(
                  currencyFormat.format(quotation.totalAmount),
                  style: AppTheme.textStyle20SemiBold.copyWith(
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLineItem(QuotationItem item, NumberFormat currencyFormat) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: AppTheme.neutralLightGray.withValues(alpha: 0.5),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(item.description, style: AppTheme.textStyle14),
          ),
          Expanded(
            child: Text(
              currencyFormat.format(item.cost),
              style: AppTheme.textStyle14Medium,
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPdfTab() {
    if (_pdfLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading PDF...'),
          ],
        ),
      );
    }

    if (_pdfError != null || _pdfPath == null) {
      return Center(
        child: Container(
          margin: const EdgeInsets.all(32),
          padding: const EdgeInsets.all(40),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppTheme.neutralLightGray,
              width: 2,
              style: BorderStyle.solid,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.picture_as_pdf,
                  size: 40,
                  color: AppTheme.primaryBlue,
                ),
              ),
              const SizedBox(height: 24),
              Text('PDF Document', style: AppTheme.textStyle20SemiBold),
              const SizedBox(height: 8),
              Text(
                'The PDF document preview will be\navailable when connected to backend.',
                style: AppTheme.textStyle14.copyWith(
                  color: AppTheme.neutralGray,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Add a sample_invoice.pdf to assets folder',
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.visibility),
                label: const Text('Preview Placeholder'),
              ),
            ],
          ),
        ),
      );
    }

    return PDFView(
      filePath: _pdfPath!,
      enableSwipe: true,
      swipeHorizontal: false,
      autoSpacing: true,
      pageFling: true,
      pageSnap: true,
      fitPolicy: FitPolicy.BOTH,
      preventLinkNavigation: false,
      onRender: (pages) {
        debugPrint('PDF rendered with $pages pages');
      },
      onError: (error) {
        debugPrint('PDF Error: $error');
      },
      onPageError: (page, error) {
        debugPrint('PDF Page $page Error: $error');
      },
    );
  }

  Widget _buildActionButtons(BuildContext context, Quotation quotation) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: AppTheme.neutralDark.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () {
                _showRejectConfirmation(context);
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.errorRed,
                side: BorderSide(color: AppTheme.errorRed),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Reject'),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: () {
                _showApproveConfirmation(context, quotation);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.successGreen,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Approve Quotation'),
            ),
          ),
        ],
      ),
    );
  }

  void _showApproveConfirmation(BuildContext context, Quotation quotation) {
    final currencyFormat = NumberFormat.currency(
      symbol: '\$',
      decimalDigits: 2,
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Approve Quotation?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'You are about to approve this quotation for:',
              style: AppTheme.textStyle14,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.backgroundLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Amount', style: AppTheme.textStyle14Medium),
                  Text(
                    currencyFormat.format(quotation.totalAmount),
                    style: AppTheme.textStyle16SemiBold.copyWith(
                      color: AppTheme.primaryBlue,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Quotation approved successfully!'),
                  backgroundColor: AppTheme.successGreen,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.successGreen,
            ),
            child: const Text('Approve'),
          ),
        ],
      ),
    );
  }

  void _showRejectConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Reject Quotation?'),
        content: const Text(
          'Are you sure you want to reject this quotation? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Quotation rejected'),
                  backgroundColor: AppTheme.errorRed,
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorRed),
            child: const Text('Reject'),
          ),
        ],
      ),
    );
  }
}
