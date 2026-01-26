import 'dart:io';
import 'package:flutter/services.dart';

import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/features/quotation/data/quotation_repository.dart';
import 'package:bb_logistics/src/features/quotation/domain/quotation.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';

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
  bool _pdfLoading = false;
  String? _pdfError;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  Future<void> _loadPdfFromUrl(String? pdfUrl) async {
    if (pdfUrl == null || pdfUrl.isEmpty) {
      if (mounted) {
        setState(() {
          _pdfLoading = false;
          _pdfError = 'No PDF available';
        });
      }
      return;
    }

    try {
      if (mounted) {
        setState(() {
          _pdfLoading = true;
          _pdfError = null;
        });
      }

      // Download PDF from URL
      final response = await HttpClient()
          .getUrl(Uri.parse(pdfUrl))
          .then((req) => req.close());
      final bytes = await consolidateHttpClientResponseBytes(response);

      final dir = await getTemporaryDirectory();
      final fileName = 'quotation_${DateTime.now().millisecondsSinceEpoch}.pdf';
      final file = File('${dir.path}/$fileName');
      await file.writeAsBytes(bytes);

      if (mounted) {
        setState(() {
          _pdfPath = file.path;
          _pdfLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _pdfLoading = false;
          _pdfError = 'Failed to load PDF';
        });
      }
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
      backgroundColor: AppTheme.background,
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
            color: AppTheme.textGrey.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Quotation not found',
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: AppTheme.textGrey),
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
            color: AppTheme.error.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Failed to load quotation',
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: AppTheme.textGrey),
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
    if (quotation.status == QuotationStatus.requestSent ||
        quotation.status == QuotationStatus.approved ||
        quotation.status == QuotationStatus.detailsSubmitted) {
      return Column(
        children: [
          _buildSummaryCard(quotation),
          _buildPendingBanner(context, quotation.status),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _buildPendingItemsList(context, quotation),
            ),
          ),
        ],
      );
    } else if (quotation.status == QuotationStatus.rejected) {
      return Column(
        children: [
          _buildSummaryCard(quotation),
          _buildRejectedBanner(context),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _buildPendingItemsList(context, quotation),
            ),
          ),
        ],
      );
    }

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
            unselectedLabelColor: AppTheme.textGrey,
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
            children: [_buildBreakdownTab(quotation), _buildPdfTab(quotation)],
          ),
        ),

        // Action Buttons
        if (quotation.status == QuotationStatus.costCalculated ||
            quotation.status == QuotationStatus.shipped)
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

    return LayoutBuilder(
      builder: (context, constraints) {
        final isSmallScreen = constraints.maxWidth < 350;
        final padding = isSmallScreen ? 12.0 : 20.0;

        return Container(
          margin: EdgeInsets.all(isSmallScreen ? 12 : 16),
          padding: EdgeInsets.all(padding),
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
              Wrap(
                spacing: 12,
                runSpacing: 12,
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Quotation ID',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: isSmallScreen ? 10 : 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        quotation.quotationId ?? quotation.id,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: isSmallScreen ? 14 : 16,
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
              Wrap(
                spacing: 16,
                runSpacing: 12,
                alignment: WrapAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: isSmallScreen
                        ? CrossAxisAlignment.start
                        : CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Created Date',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: isSmallScreen ? 10 : 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        dateFormat.format(quotation.createdDate),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white,
                          fontSize: isSmallScreen ? 12 : 14,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              if (quotation.status != QuotationStatus.requestSent &&
                  quotation.status != QuotationStatus.rejected) ...[
                const SizedBox(height: 20),
                Center(
                  child: Column(
                    children: [
                      Text(
                        'Total Amount',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: isSmallScreen ? 12 : 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          currencyFormat.format(quotation.totalAmount),
                          style: Theme.of(context).textTheme.displaySmall
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: isSmallScreen ? 20 : 24,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(QuotationStatus status) {
    Color badgeColor;
    switch (status) {
      case QuotationStatus.costCalculated:
        badgeColor = AppTheme.success;
        break;
      case QuotationStatus.sent:
        badgeColor = AppTheme.success;
        break;
      case QuotationStatus.accepted:
        badgeColor = Colors.green[800]!;
        break;
      case QuotationStatus.requestSent:
        badgeColor = AppTheme.warning;
        break;
      case QuotationStatus.rejected:
        badgeColor = AppTheme.error;
        break;
      case QuotationStatus.readyForPickup:
        badgeColor = AppTheme.primaryBlue;
        break;
      case QuotationStatus.shipped:
        badgeColor = Colors.purple;
        break;
      case QuotationStatus.delivered:
        badgeColor = Colors.green[800]!;
        break;
      case QuotationStatus.approved:
        badgeColor = AppTheme.warning;
        break;
      case QuotationStatus.detailsSubmitted:
        badgeColor = Colors.blueGrey;
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
            status == QuotationStatus.requestSent
                ? 'Request Sent'
                : status.displayName,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: badgeColor,
              fontWeight: FontWeight.bold,
            ),
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

    // Show placeholder for pending quotations
    if (quotation.status == QuotationStatus.requestSent ||
        quotation.status == QuotationStatus.approved ||
        quotation.status == QuotationStatus.detailsSubmitted) {
      return Center(
        child: Container(
          margin: const EdgeInsets.all(32),
          padding: const EdgeInsets.all(40),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppTheme.textGrey.withValues(alpha: 0.2),
              width: 2,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.warning.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.hourglass_empty,
                  size: 40,
                  color: AppTheme.warning,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Pending Review',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Text(
                'Pricing details will be available\nonce the Manager approves this request.',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: AppTheme.textGrey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.textGrey.withValues(alpha: 0.2)),
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Itemized Breakdown',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Header Row
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.background,
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
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppTheme.textGrey,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'Cost',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppTheme.textGrey,
                          fontWeight: FontWeight.bold,
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
                color: AppTheme.textGrey.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(1),
              ),
            ),
            const SizedBox(height: 16),

            // Total Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total Amount',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  currencyFormat.format(quotation.totalAmount),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppTheme.primaryBlue,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),

            if (quotation.additionalNotes != null &&
                quotation.additionalNotes!.trim().isNotEmpty) ...[
              const SizedBox(height: 24),
              Container(
                height: 2,
                decoration: BoxDecoration(
                  color: AppTheme.textGrey.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Terms & Notes',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textGrey,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppTheme.textGrey.withValues(alpha: 0.1),
                  ),
                ),
                child: Text(
                  quotation.additionalNotes!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    height: 1.5,
                    color: AppTheme.textGrey,
                  ),
                ),
              ),
            ],
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
          bottom: BorderSide(color: AppTheme.textGrey.withValues(alpha: 0.1)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(
              item.description,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          Expanded(
            child: Text(
              currencyFormat.format(item.cost),
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingBanner(BuildContext context, QuotationStatus status) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.warning.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: AppTheme.warning),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              status == QuotationStatus.approved
                  ? 'Request Approved. Please provide address details.'
                  : status == QuotationStatus.detailsSubmitted
                  ? 'Address Submitted. Waiting for final pricing calculation.'
                  : 'Request Sent. Waiting for Manager to calculate cost.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.warning,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingItemsList(BuildContext context, Quotation quotation) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.textGrey.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryBlue.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Requested Items',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          ...quotation.items.map(
            (item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  const Icon(
                    Icons.inventory_2_outlined,
                    size: 20,
                    color: AppTheme.textGrey,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      item.description,
                      style: Theme.of(context).textTheme.bodyMedium,
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

  Widget _buildPdfTab(Quotation quotation) {
    // Show pending state for pending quotations
    if (quotation.status == QuotationStatus.requestSent ||
        quotation.status == QuotationStatus.approved ||
        quotation.status == QuotationStatus.detailsSubmitted) {
      return Center(
        child: Container(
          margin: const EdgeInsets.all(32),
          padding: const EdgeInsets.all(40),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppTheme.textGrey.withValues(alpha: 0.2),
              width: 2,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.warning.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.hourglass_empty,
                  size: 40,
                  color: AppTheme.warning,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Pending Review',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Text(
                'The PDF invoice will be available\nonce the Manager approves this request.',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: AppTheme.textGrey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    // Load PDF from URL if not already loaded
    if (_pdfPath == null && !_pdfLoading && _pdfError == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadPdfFromUrl(quotation.pdfUrl);
      });
    }

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
      return SingleChildScrollView(
        child: Center(
          child: Container(
            margin: const EdgeInsets.all(32),
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppTheme.textGrey.withValues(alpha: 0.2),
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
                  child: const Icon(
                    Icons.picture_as_pdf,
                    size: 40,
                    color: AppTheme.primaryBlue,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'PDF Not Provided',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'The PDF document has not been provided yet.\nIt will be available once processed.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: AppTheme.textGrey),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                OutlinedButton.icon(
                  onPressed: () {
                    _loadPdfFromUrl(quotation.pdfUrl);
                  },
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ),
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

  Widget _buildRejectedBanner(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.error.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          const Icon(Icons.cancel_outlined, color: AppTheme.error),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Request Rejected',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.error,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, Quotation quotation) {
    if (quotation.status == QuotationStatus.costCalculated ||
        quotation.status == QuotationStatus.sent) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              offset: const Offset(0, -4),
              blurRadius: 16,
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    // For now, we reuse the dialog but we should probably have a different flow for acceptance
                    // Since backend doesn't have specific 'accept' endpoint other than confirm-address or similar?
                    // Let's assume confirmAddress is still the way to "finalize" it or we need a new one.
                    // The previous flow used confirmAddress to finalize.
                    _showAddressConfirmationDialog(context, quotation);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.success,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Accept Quotation',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    } else if (quotation.status == QuotationStatus.shipped) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Tracking functionality coming soon...'),
                  ),
                );
              },
              icon: const Icon(Icons.local_shipping_outlined),
              label: const Text('Track Shipment'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: AppTheme.primaryBlue,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }

  Widget _buildStyledTextField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    TextInputType inputType = TextInputType.text,
    String? Function(String?)? validator,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: AppTheme.textGrey,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: inputType,
          textCapitalization:
              (inputType == TextInputType.name ||
                  inputType == TextInputType.text)
              ? TextCapitalization.words
              : TextCapitalization.none,
          validator: validator,
          inputFormatters: inputFormatters,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.grey.shade50,
            prefixIcon: Icon(icon, color: AppTheme.primaryBlue),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: AppTheme.primaryBlue,
                width: 1.5,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.error, width: 1),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: AppTheme.primaryBlue,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 2,
          width: 40,
          decoration: BoxDecoration(
            color: AppTheme.primaryBlue,
            borderRadius: BorderRadius.circular(1),
          ),
        ),
        const SizedBox(height: 4),
        Container(
          height: 1,
          width: double.infinity,
          color: AppTheme.textGrey.withValues(alpha: 0.1),
        ),
      ],
    );
  }

  void _showAddressConfirmationDialog(
    BuildContext context,
    Quotation quotation,
  ) {
    final formKey = GlobalKey<FormState>();
    final pickupNameController = TextEditingController(
      text: quotation.origin?.name,
    );
    final pickupAddressController = TextEditingController(
      text: quotation.origin?.addressLine,
    );
    final pickupCityController = TextEditingController(
      text: quotation.origin?.city,
    );
    final pickupZipController = TextEditingController(
      text: quotation.origin?.zip,
    );
    final pickupCountryController = TextEditingController(
      text: quotation.origin?.country,
    );
    final pickupPhoneController = TextEditingController(
      text: quotation.origin?.phone,
    );

    final deliveryNameController = TextEditingController(
      text: quotation.destination?.name,
    );
    final deliveryAddressController = TextEditingController(
      text: quotation.destination?.addressLine,
    );
    final deliveryCityController = TextEditingController(
      text: quotation.destination?.city,
    );
    final deliveryZipController = TextEditingController(
      text: quotation.destination?.zip,
    );
    final deliveryCountryController = TextEditingController(
      text: quotation.destination?.country,
    );
    final deliveryPhoneController = TextEditingController(
      text: quotation.destination?.phone,
    );

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        insetPadding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  const Icon(Icons.pin_drop, color: AppTheme.primaryBlue),
                  const SizedBox(width: 12),
                  const Text(
                    'Confirm Address Details',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Scrollable Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Pickup Section
                      _buildSectionHeader('Pickup Details'),
                      const SizedBox(height: 20),
                      _buildStyledTextField(
                        label: 'Contact Name',
                        controller: pickupNameController,
                        icon: Icons.person,
                        inputType: TextInputType.name,
                        validator: (v) =>
                            v?.isEmpty == true ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      _buildStyledTextField(
                        label: 'Phone Number',
                        controller: pickupPhoneController,
                        icon: Icons.phone,
                        inputType: TextInputType.phone,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                            RegExp(r'[0-9+\-\(\)\s]'),
                          ),
                        ],
                        validator: (v) =>
                            v?.isEmpty == true ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      _buildStyledTextField(
                        label: 'Address Line',
                        controller: pickupAddressController,
                        icon: Icons.home,
                        inputType: TextInputType.text,
                        validator: (v) =>
                            v?.isEmpty == true ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: _buildStyledTextField(
                              label: 'City',
                              controller: pickupCityController,
                              icon: Icons.location_city,
                              inputType: TextInputType.text,
                              validator: (v) =>
                                  v?.isEmpty == true ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildStyledTextField(
                              label: 'Zip/Postal Code',
                              controller: pickupZipController,
                              icon: Icons.map,
                              inputType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                              ],
                              validator: (v) =>
                                  v?.isEmpty == true ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildStyledTextField(
                        label: 'Country',
                        controller: pickupCountryController,
                        icon: Icons.public,
                        inputType: TextInputType.text,
                        validator: (v) =>
                            v?.isEmpty == true ? 'Required' : null,
                      ),

                      const SizedBox(height: 32),

                      // Delivery Section
                      _buildSectionHeader('Delivery Details'),
                      const SizedBox(height: 20),
                      _buildStyledTextField(
                        label: 'Recipient Name',
                        controller: deliveryNameController,
                        icon: Icons.person,
                        inputType: TextInputType.name,
                        validator: (v) =>
                            v?.isEmpty == true ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      _buildStyledTextField(
                        label: 'Phone Number',
                        controller: deliveryPhoneController,
                        icon: Icons.phone,
                        inputType: TextInputType.phone,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                            RegExp(r'[0-9+\-\(\)\s]'),
                          ),
                        ],
                        validator: (v) =>
                            v?.isEmpty == true ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      _buildStyledTextField(
                        label: 'Address Line',
                        controller: deliveryAddressController,
                        icon: Icons.home,
                        inputType: TextInputType.text,
                        validator: (v) =>
                            v?.isEmpty == true ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: _buildStyledTextField(
                              label: 'City',
                              controller: deliveryCityController,
                              icon: Icons.location_city,
                              inputType: TextInputType.text,
                              validator: (v) =>
                                  v?.isEmpty == true ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildStyledTextField(
                              label: 'Zip/Postal Code',
                              controller: deliveryZipController,
                              icon: Icons.map,
                              inputType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                              ],
                              validator: (v) =>
                                  v?.isEmpty == true ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildStyledTextField(
                        label: 'Country',
                        controller: deliveryCountryController,
                        icon: Icons.public,
                        inputType: TextInputType.text,
                        validator: (v) =>
                            v?.isEmpty == true ? 'Required' : null,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const Divider(height: 1),

            // Footer
            Padding(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    if (formKey.currentState?.validate() == true) {
                      try {
                        // Show loading
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (c) =>
                              const Center(child: CircularProgressIndicator()),
                        );

                        final pickupAddress = {
                          'name': pickupNameController.text,
                          'phone': pickupPhoneController.text,
                          'addressLine': pickupAddressController.text,
                          'city': pickupCityController.text,
                          'zip': pickupZipController.text,
                          'country': pickupCountryController.text,
                        };

                        final deliveryAddress = {
                          'name': deliveryNameController.text,
                          'phone': deliveryPhoneController.text,
                          'addressLine': deliveryAddressController.text,
                          'city': deliveryCityController.text,
                          'zip': deliveryZipController.text,
                          'country': deliveryCountryController.text,
                        };

                        await ref
                            .read(quotationRepositoryProvider)
                            .confirmAddress(
                              quotation.id,
                              pickupAddress,
                              deliveryAddress,
                            );

                        // Close loading
                        if (context.mounted) Navigator.pop(context);

                        // Close dialog
                        if (context.mounted) Navigator.pop(context);

                        // Refresh
                        ref.invalidate(quotationByIdProvider(quotation.id));
                        ref.invalidate(quotationsProvider);

                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Address confirmed! Request sent for pickup.',
                              ),
                              backgroundColor: AppTheme.success,
                            ),
                          );
                        }
                      } catch (e) {
                        // Close loading
                        if (context.mounted) Navigator.pop(context);

                        if (context.mounted) {
                          ScaffoldMessenger.of(
                            context,
                          ).showSnackBar(SnackBar(content: Text('Error: $e')));
                        }
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBlue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Confirm & Submit',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
