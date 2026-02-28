import 'package:flutter/services.dart';

import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/features/quotation/data/quotation_repository.dart';
import 'package:bb_logistics/src/features/quotation/domain/quotation.dart';
import 'package:bb_logistics/src/features/shipment/presentation/shipment_form_notifier.dart';
import 'package:bb_logistics/src/features/shipment/presentation/widgets/shipment_item_form.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:bb_logistics/src/features/quotation/presentation/widgets/live_quotation_ledger.dart';

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
      appBar: _buildAppBar(context, quotationAsync.asData?.value),
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

  PreferredSizeWidget _buildAppBar(BuildContext context, Quotation? quotation) {
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
          onPressed: (quotation != null && quotation.pdfUrl != null)
              ? () => _launchPdfUrl(context, quotation.pdfUrl!)
              : null,
        ),
      ],
    );
  }

  Future<void> _launchPdfUrl(BuildContext context, String url) async {
    try {
      final uri = Uri.parse(url);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        if (context.mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Could not launch PDF')));
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error launching PDF: $e')));
      }
    }
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
    return Column(
      children: [
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(quotationByIdProvider(widget.quotationId));
              return Future<void>.delayed(const Duration(milliseconds: 500));
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Center(child: LiveQuotationLedger(quotation: quotation)),
            ),
          ),
        ),
        _buildActionBottomBar(context, quotation),
      ],
    );
  }

  Widget _buildActionBottomBar(BuildContext context, Quotation quotation) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(20),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: _getActionContent(context, quotation),
        ),
      ),
    );
  }

  Widget _getActionContent(BuildContext context, Quotation quotation) {
    final status = quotation.status;

    // Admin reviewing or finalizing
    if (status == QuotationStatus.draft ||
        status == QuotationStatus.requestSent ||
        status == QuotationStatus.approved ||
        status == QuotationStatus.infoRequired ||
        // Assuming AWAITING_FINAL_CHARGE_SHEET maps to addressProvided / detailsSubmitted
        status == QuotationStatus.addressProvided ||
        status == QuotationStatus.detailsSubmitted) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.hourglass_empty, color: Colors.grey.shade600, size: 20),
            const SizedBox(width: 8),
            Text(
              'Awaiting Admin Action...',
              style: TextStyle(
                color: Colors.grey.shade700,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      );
    }

    // PENDING_CUSTOMER_APPROVAL â†’ costCalculated: Admin priced, client decides
    if (status == QuotationStatus.costCalculated) {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => _handleEditRequest(context, quotation),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: AppTheme.primaryBlue),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Edit Request'),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: ElevatedButton(
              onPressed: () => _showFulfillmentDialog(context, quotation),
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
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      );
    }

    // PAYMENT_PENDING -> maps to sent maybe or we show button to proceed
    if (status == QuotationStatus.sent) {
      return ElevatedButton(
        onPressed: () => _handleProceedToPayment(context, quotation),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryBlue,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          'Proceed to Payment',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      );
    }

    // Post payment states
    if (status == QuotationStatus.accepted ||
        status == QuotationStatus.shipped ||
        status == QuotationStatus.readyForPickup) {
      return ElevatedButton.icon(
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
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  void _handleProceedToPayment(BuildContext context, Quotation quotation) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Mock Payment'),
        content: const Text(
          'Simulating successful payment and transitioning quotation...',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Optimistically update status or call mock API
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Payment Successful! Tracking Started.'),
                  backgroundColor: AppTheme.success,
                ),
              );
            },
            child: const Text('Simulate Success'),
          ),
        ],
      ),
    );
  }

  // â”€â”€ Edit Request: open item editor â†’ PATCH /workflow/revise â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  void _handleEditRequest(BuildContext context, Quotation quotation) {
    // Start with the current items from the quotation
    List<ShipmentItemFormData> editableItems = quotation.items
        .map(
          (i) => ShipmentItemFormData(
            description: i.description,
            quantity: i.quantity,
            weight: i.weight,
            dimensions: i.dimensions,
            images: i.images,
            category: i.category,
            isHazardous: i.isHazardous,
            videoUrl: i.videoUrl,
            targetRate: i.targetRate,
            declaredValue: i.declaredValue,
            packingVolume: i.packingVolume,
            cost: i.cost,
          ),
        )
        .toList();

    final notesController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black54,
      builder: (ctx) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: DraggableScrollableSheet(
            initialChildSize: 0.85,
            maxChildSize: 0.95,
            minChildSize: 0.4,
            builder: (ctx, scrollCtrl) {
              return Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: StatefulBuilder(
                  builder: (ctx, setSheetState) {
                    return Column(
                      children: [
                        const SizedBox(height: 12),
                        Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 16,
                          ),
                          child: Row(
                            children: [
                              const Text(
                                'Edit Request Items',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const Spacer(),
                              IconButton(
                                icon: const Icon(Icons.close),
                                onPressed: () => Navigator.pop(ctx),
                              ),
                            ],
                          ),
                        ),
                        const Divider(height: 1),
                        Expanded(
                          child: SingleChildScrollView(
                            controller: scrollCtrl,
                            padding: EdgeInsets.fromLTRB(
                              16,
                              16,
                              16,
                              MediaQuery.of(context).viewInsets.bottom + 24,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Item list
                                ...editableItems.asMap().entries.map((entry) {
                                  int i = entry.key;
                                  ShipmentItemFormData itm = entry.value;
                                  return Card(
                                    elevation: 0,
                                    margin: const EdgeInsets.only(bottom: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      side: BorderSide(
                                        color: Colors.grey.shade200,
                                      ),
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: ShipmentItemForm(
                                        index: i,
                                        item: itm,
                                        onChanged: (updated) {
                                          setSheetState(() {
                                            editableItems[i] = updated;
                                          });
                                        },
                                        onRemove: () {
                                          setSheetState(() {
                                            editableItems.removeAt(i);
                                          });
                                        },
                                      ),
                                    ),
                                  );
                                }),
                                // Add item
                                OutlinedButton.icon(
                                  onPressed: () {
                                    setSheetState(() {
                                      editableItems.add(
                                        ShipmentItemFormData(
                                          description: '',
                                          quantity: 1,
                                          weight: 0,
                                          dimensions: '',
                                          images: const [],
                                          category: 'General',
                                          isHazardous: false,
                                        ),
                                      );
                                    });
                                  },
                                  icon: const Icon(Icons.add),
                                  label: const Text('Add Item'),
                                  style: OutlinedButton.styleFrom(
                                    minimumSize: const Size(
                                      double.infinity,
                                      44,
                                    ),
                                    foregroundColor: AppTheme.primaryBlue,
                                    side: const BorderSide(
                                      color: AppTheme.primaryBlue,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 20),
                                // Revision notes
                                const Text(
                                  'Revision Notes',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: notesController,
                                  maxLines: 3,
                                  decoration: InputDecoration(
                                    hintText:
                                        'Explain what you changed or why...',
                                    hintStyle: TextStyle(
                                      color: Colors.grey.shade400,
                                      fontSize: 13,
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    contentPadding: const EdgeInsets.all(14),
                                  ),
                                ),
                                const SizedBox(height: 24),
                                // Submit
                                SizedBox(
                                  width: double.infinity,
                                  height: 50,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primaryBlue,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    onPressed: () async {
                                      // Build revised items payload
                                      final itemsPayload = editableItems
                                          .map(
                                            (it) => {
                                              'description': it.description,
                                              'quantity': it.quantity,
                                              'weight': it.weight,
                                              'dimensions':
                                                  it.dimensions ?? 'N/A',
                                              'category': it.category,
                                              'isHazardous': it.isHazardous,
                                              'images': it.images,
                                              if (it.targetRate != null)
                                                'targetRate': it.targetRate,
                                              if (it.packingVolume != null)
                                                'packingVolume':
                                                    it.packingVolume,
                                              if (it.declaredValue != null)
                                                'declaredValue':
                                                    it.declaredValue,
                                              if (it.videoUrl != null &&
                                                  it.videoUrl!.isNotEmpty)
                                                'videoUrl': it.videoUrl,
                                            },
                                          )
                                          .toList();

                                      Navigator.pop(ctx);
                                      // Show loader
                                      if (context.mounted) {
                                        showDialog(
                                          context: context,
                                          barrierDismissible: false,
                                          builder: (_) => const Center(
                                            child: CircularProgressIndicator(),
                                          ),
                                        );
                                      }
                                      try {
                                        await ref
                                            .read(quotationRepositoryProvider)
                                            .customerReviseQuotation(
                                              quotation.id,
                                              {
                                                'items': itemsPayload,
                                                'revisionNotes': notesController
                                                    .text
                                                    .trim(),
                                              },
                                            );
                                        if (context.mounted) {
                                          Navigator.pop(
                                            context,
                                          ); // close loader
                                          ref.invalidate(
                                            quotationByIdProvider(quotation.id),
                                          );
                                          ref.invalidate(quotationsProvider);
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            const SnackBar(
                                              content: Text(
                                                'âœ“ Revision submitted. Admin will re-price.',
                                              ),
                                              backgroundColor: Colors.green,
                                            ),
                                          );
                                        }
                                      } catch (e) {
                                        if (context.mounted) {
                                          Navigator.pop(
                                            context,
                                          ); // close loader
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            SnackBar(
                                              content: Text('Error: $e'),
                                              backgroundColor: Colors.red,
                                            ),
                                          );
                                        }
                                      }
                                    },
                                    child: const Text(
                                      'SUBMIT REVISION',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              );
            },
          ),
        );
      },
    );
  }

  // â”€â”€ Accept Quotation: collect fulfillmentDetails â†’ PATCH /workflow/accept â”€â”€
  void _showFulfillmentDialog(BuildContext context, Quotation quotation) {
    final formKey = GlobalKey<FormState>();

    // Pickup fields
    final pickupCityCtrl = TextEditingController(
      text: quotation.routingSourceCity ?? quotation.origin?.city ?? '',
    );
    final pickupAddressCtrl = TextEditingController(
      text: quotation.origin?.addressLine ?? '',
    );
    final pickupStateCtrl = TextEditingController(
      text: quotation.origin?.state ?? '',
    );
    final pickupCountryCtrl = TextEditingController(
      text: quotation.origin?.country ?? '',
    );
    final pickupZipCtrl = TextEditingController(
      text: quotation.origin?.zip ?? '',
    );
    final senderNameCtrl = TextEditingController(
      text: quotation.origin?.name ?? '',
    );
    final senderPhoneCtrl = TextEditingController(
      text: quotation.origin?.phone ?? '',
    );
    String pickupType = 'HOME_PICKUP'; // or WAREHOUSE_DROP

    // Delivery fields
    final deliveryCityCtrl = TextEditingController(
      text:
          quotation.routingDestinationCity ?? quotation.destination?.city ?? '',
    );
    final deliveryAddressCtrl = TextEditingController(
      text: quotation.destination?.addressLine ?? '',
    );
    final deliveryStateCtrl = TextEditingController(
      text: quotation.destination?.state ?? '',
    );
    final deliveryCountryCtrl = TextEditingController(
      text: quotation.destination?.country ?? '',
    );
    final deliveryZipCtrl = TextEditingController(
      text: quotation.destination?.zip ?? '',
    );
    final recipientNameCtrl = TextEditingController(
      text: quotation.destination?.name ?? '',
    );
    final recipientPhoneCtrl = TextEditingController(
      text: quotation.destination?.phone ?? '',
    );
    String deliveryType = 'HOME_DELIVERY'; // or WAREHOUSE_PICKUP

    showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black54,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: StatefulBuilder(
          builder: (ctx, setDialogState) {
            return Dialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              insetPadding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 12, 12),
                    child: Row(
                      children: [
                        const Icon(Icons.pin_drop, color: AppTheme.primaryBlue),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'Confirm Fulfillment Details',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  // Scrollable form
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Form(
                        key: formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // â”€â”€ PICKUP TYPE â”€â”€
                            _buildSectionHeader('Origin / Pickup'),
                            const SizedBox(height: 12),
                            const Text(
                              'How will you hand over the goods?',
                              style: TextStyle(
                                color: Colors.grey,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildPickupTypeChip(
                                    ctx,
                                    setDialogState,
                                    label: 'Home/Office Pickup',
                                    value: 'HOME_PICKUP',
                                    current: pickupType,
                                    icon: Icons.home_outlined,
                                    onTap: () => setDialogState(
                                      () => pickupType = 'HOME_PICKUP',
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildPickupTypeChip(
                                    ctx,
                                    setDialogState,
                                    label: 'Drop at Warehouse',
                                    value: 'WAREHOUSE_DROP',
                                    current: pickupType,
                                    icon: Icons.warehouse_outlined,
                                    onTap: () => setDialogState(
                                      () => pickupType = 'WAREHOUSE_DROP',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildStyledTextField(
                              label: 'Sender Name',
                              controller: senderNameCtrl,
                              icon: Icons.person,
                              validator: (v) =>
                                  v?.isEmpty == true ? 'Required' : null,
                            ),
                            const SizedBox(height: 12),
                            _buildStyledTextField(
                              label: 'Sender Phone',
                              controller: senderPhoneCtrl,
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
                            const SizedBox(height: 12),
                            if (pickupType == 'HOME_PICKUP') ...[
                              _buildStyledTextField(
                                label: 'Pickup Address Line',
                                controller: pickupAddressCtrl,
                                icon: Icons.home,
                                validator: (v) =>
                                    v?.isEmpty == true ? 'Required' : null,
                              ),
                              const SizedBox(height: 12),
                            ],
                            Row(
                              children: [
                                Expanded(
                                  child: _buildStyledTextField(
                                    label: 'City *',
                                    controller: pickupCityCtrl,
                                    icon: Icons.location_city,
                                    validator: (v) =>
                                        v?.isEmpty == true ? 'Required' : null,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildStyledTextField(
                                    label: 'State',
                                    controller: pickupStateCtrl,
                                    icon: Icons.map_outlined,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildStyledTextField(
                                    label: 'Country',
                                    controller: pickupCountryCtrl,
                                    icon: Icons.public,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildStyledTextField(
                                    label: 'ZIP/Postal',
                                    controller: pickupZipCtrl,
                                    icon: Icons.local_post_office_outlined,
                                    inputType: TextInputType.number,
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 28),

                            // â”€â”€ DELIVERY TYPE â”€â”€
                            _buildSectionHeader('Destination / Delivery'),
                            const SizedBox(height: 12),
                            const Text(
                              'How should goods be delivered to recipient?',
                              style: TextStyle(
                                color: Colors.grey,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildPickupTypeChip(
                                    ctx,
                                    setDialogState,
                                    label: 'Home Delivery',
                                    value: 'HOME_DELIVERY',
                                    current: deliveryType,
                                    icon: Icons.delivery_dining_outlined,
                                    onTap: () => setDialogState(
                                      () => deliveryType = 'HOME_DELIVERY',
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildPickupTypeChip(
                                    ctx,
                                    setDialogState,
                                    label: 'Warehouse Pickup',
                                    value: 'WAREHOUSE_PICKUP',
                                    current: deliveryType,
                                    icon: Icons.warehouse_outlined,
                                    onTap: () => setDialogState(
                                      () => deliveryType = 'WAREHOUSE_PICKUP',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildStyledTextField(
                              label: 'Recipient Name',
                              controller: recipientNameCtrl,
                              icon: Icons.person,
                              validator: (v) =>
                                  v?.isEmpty == true ? 'Required' : null,
                            ),
                            const SizedBox(height: 12),
                            _buildStyledTextField(
                              label: 'Recipient Phone',
                              controller: recipientPhoneCtrl,
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
                            const SizedBox(height: 12),
                            if (deliveryType == 'HOME_DELIVERY') ...[
                              _buildStyledTextField(
                                label: 'Delivery Address Line',
                                controller: deliveryAddressCtrl,
                                icon: Icons.home,
                                validator: (v) =>
                                    v?.isEmpty == true ? 'Required' : null,
                              ),
                              const SizedBox(height: 12),
                            ],
                            Row(
                              children: [
                                Expanded(
                                  child: _buildStyledTextField(
                                    label: 'City *',
                                    controller: deliveryCityCtrl,
                                    icon: Icons.location_city,
                                    validator: (v) =>
                                        v?.isEmpty == true ? 'Required' : null,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildStyledTextField(
                                    label: 'State',
                                    controller: deliveryStateCtrl,
                                    icon: Icons.map_outlined,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildStyledTextField(
                                    label: 'Country',
                                    controller: deliveryCountryCtrl,
                                    icon: Icons.public,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildStyledTextField(
                                    label: 'ZIP/Postal',
                                    controller: deliveryZipCtrl,
                                    icon: Icons.local_post_office_outlined,
                                    inputType: TextInputType.number,
                                  ),
                                ),
                              ],
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
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.success,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () async {
                          if (formKey.currentState?.validate() != true) return;
                          Navigator.pop(ctx); // close form dialog
                          // Show loading
                          if (context.mounted) {
                            showDialog(
                              context: context,
                              barrierDismissible: false,
                              builder: (_) => const Center(
                                child: CircularProgressIndicator(),
                              ),
                            );
                          }
                          try {
                            final fulfillmentDetails = {
                              'pickupType': pickupType,
                              'deliveryType': deliveryType,
                              'pickupCity': pickupCityCtrl.text.trim(),
                              'pickupState': pickupStateCtrl.text.trim(),
                              'pickupCountry': pickupCountryCtrl.text.trim(),
                              'pickupZip': pickupZipCtrl.text.trim(),
                              'pickupAddressLine': pickupAddressCtrl.text
                                  .trim(),
                              'senderName': senderNameCtrl.text.trim(),
                              'senderPhone': senderPhoneCtrl.text.trim(),
                              'deliveryCity': deliveryCityCtrl.text.trim(),
                              'deliveryState': deliveryStateCtrl.text.trim(),
                              'deliveryCountry': deliveryCountryCtrl.text
                                  .trim(),
                              'deliveryZip': deliveryZipCtrl.text.trim(),
                              'deliveryAddressLine': deliveryAddressCtrl.text
                                  .trim(),
                              'recipientName': recipientNameCtrl.text.trim(),
                              'recipientPhone': recipientPhoneCtrl.text.trim(),
                            };

                            await ref
                                .read(quotationRepositoryProvider)
                                .customerAcceptQuotation(
                                  quotation.id,
                                  fulfillmentDetails,
                                );

                            if (context.mounted) {
                              Navigator.pop(context); // close loader
                              ref.invalidate(
                                quotationByIdProvider(quotation.id),
                              );
                              ref.invalidate(quotationsProvider);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'âœ“ Quotation accepted! Admin will issue the charge sheet.',
                                  ),
                                  backgroundColor: Colors.green,
                                  duration: Duration(seconds: 4),
                                ),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              Navigator.pop(context); // close loader
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Error: $e'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          }
                        },
                        child: const Text(
                          'CONFIRM & ACCEPT QUOTATION',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildPickupTypeChip(
    BuildContext context,
    StateSetter setState, {
    required String label,
    required String value,
    required String current,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    final selected = current == value;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.primaryBlue.withValues(alpha: 0.1)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? AppTheme.primaryBlue : Colors.grey.shade300,
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: selected ? AppTheme.primaryBlue : Colors.grey.shade500,
              size: 22,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: selected ? AppTheme.primaryBlue : Colors.grey.shade700,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
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
}
