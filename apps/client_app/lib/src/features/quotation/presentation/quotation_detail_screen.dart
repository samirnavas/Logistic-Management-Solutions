import 'package:flutter/services.dart';

import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/features/quotation/data/quotation_repository.dart';
import 'package:bb_logistics/src/features/quotation/domain/quotation.dart';
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
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Center(child: LiveQuotationLedger(quotation: quotation)),
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

    // PENDING_CUSTOMER_APPROVAL -> maps to costCalculated based on quotation.dart mapping logic
    // Actually from backend we get "cost_calculated" or "QUOTATION_GENERATED"
    if (status == QuotationStatus.costCalculated) {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => _handleModifyRequest(context, quotation),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: AppTheme.primaryBlue),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Modify Request'),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: ElevatedButton(
              onPressed: () =>
                  _showAddressConfirmationDialog(context, quotation),
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

  void _handleModifyRequest(BuildContext context, Quotation quotation) {
    showDialog(
      context: context,
      builder: (context) {
        final notesController = TextEditingController();
        return AlertDialog(
          title: const Text('Modify Request'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Provide details on what needs to be changed.'),
              const SizedBox(height: 16),
              TextField(
                controller: notesController,
                maxLines: 4,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: 'I need to add 2 more items...',
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
              onPressed: () async {
                final text = notesController.text.trim();
                Navigator.pop(context);
                if (text.isEmpty) return;

                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (c) =>
                      const Center(child: CircularProgressIndicator()),
                );

                try {
                  await ref
                      .read(quotationRepositoryProvider)
                      .customerReviseQuotation(quotation.id, {
                        'revisionNotes': text,
                      });

                  if (context.mounted) {
                    Navigator.pop(context); // close loader
                    ref.invalidate(quotationByIdProvider(quotation.id));
                    ref.invalidate(quotationsProvider);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Modification request sent.'),
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    Navigator.pop(context); // close loader
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                }
              },
              child: const Text('Submit'),
            ),
          ],
        );
      },
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
      barrierColor: Colors.black54,
      builder: (context) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: Dialog(
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
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Icon(Icons.pin_drop, color: AppTheme.primaryBlue),
                    const SizedBox(width: 12),
                    const Text(
                      'Confirm Address Details',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
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
                            builder: (c) => const Center(
                              child: CircularProgressIndicator(),
                            ),
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
                              .customerAcceptQuotation(quotation.id, {
                                'pickupAddress': pickupAddress,
                                'deliveryAddress': deliveryAddress,
                              });

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
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Error: $e')),
                            );
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
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
