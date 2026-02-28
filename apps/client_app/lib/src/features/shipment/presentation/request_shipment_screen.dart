import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/app_drawer.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/quotation/data/quotation_repository.dart';
import 'package:bb_logistics/src/features/quotation/domain/quotation.dart';
import 'package:bb_logistics/src/features/shipment/presentation/shipment_form_notifier.dart';
import 'package:bb_logistics/src/features/shipment/presentation/widgets/shipment_item_form.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class RequestShipmentScreen extends ConsumerStatefulWidget {
  final Quotation? existingQuotation;
  const RequestShipmentScreen({super.key, this.existingQuotation});

  @override
  ConsumerState<RequestShipmentScreen> createState() =>
      _RequestShipmentScreenState();
}

class _RequestShipmentScreenState extends ConsumerState<RequestShipmentScreen> {
  final _formKey = GlobalKey<FormState>();

  // --- Routing Data (Phase 1 only — region/city strings) ---
  final _sourceRegionController = TextEditingController();
  final _sourceCityController = TextEditingController();
  final _destinationRegionController = TextEditingController();
  final _destinationCityController = TextEditingController();

  // --- Cargo Meta ---
  String _shippingMode = 'By Air';
  String _servicePriority = 'Standard';
  final _notesController = TextEditingController();
  String _cargoType = 'General Cargo';

  bool _isSubmitting = false;

  static const List<String> _cargoTypes = [
    'General Cargo',
    'Fragile Goods',
    'Perishable',
    'Hazardous Material',
    'Electronic Equipment',
    'Heavy Machinery',
    'Documents',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    final q = widget.existingQuotation;
    if (q != null) {
      // Pre-fill from draft
      _sourceRegionController.text = q.routingSourceRegion ?? '';
      _sourceCityController.text = q.routingSourceCity ?? '';
      _destinationRegionController.text = q.routingDestinationRegion ?? '';
      _destinationCityController.text = q.routingDestinationCity ?? '';
      _cargoType = _cargoTypes.contains(q.cargoType)
          ? q.cargoType!
          : 'General Cargo';
      _servicePriority = q.serviceType ?? 'Standard';

      if (q.specialInstructions != null) {
        final notesIdx = q.specialInstructions!.indexOf('Notes: ');
        if (notesIdx != -1) {
          _notesController.text = q.specialInstructions!.substring(
            notesIdx + 7,
          );
        } else {
          _notesController.text = q.specialInstructions ?? '';
        }
      }

      // Restore items into form state
      final items = q.items
          .map(
            (i) => ShipmentItemFormData(
              description: i.description,
              quantity: i.quantity,
              weight: i.weight,
              dimensions: i.dimensions,
              images: i.images,
              category: i.category,
              isHazardous: i.isHazardous,
              hsCode: '',
              videoUrl: i.videoUrl,
              targetRate: i.targetRate,
              declaredValue: i.declaredValue,
              packingVolume: i.packingVolume,
              cost: i.cost,
            ),
          )
          .toList();

      Future.microtask(() {
        if (mounted) {
          ref.read(shipmentFormProvider.notifier).setItems(items);
        }
      });
    }
  }

  @override
  void dispose() {
    _sourceRegionController.dispose();
    _sourceCityController.dispose();
    _destinationRegionController.dispose();
    _destinationCityController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  void deactivate() {
    ref.invalidate(shipmentFormProvider);
    super.deactivate();
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) return;

    final formState = ref.read(shipmentFormProvider);
    if (formState.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one item.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final items = formState.items
          .map(
            (i) => {
              'description': i.description,
              'quantity': i.quantity,
              'weight': i.weight,
              'dimensions': i.dimensions ?? 'N/A',
              'category': i.category,
              'isHazardous': i.isHazardous,
              'images': i.images,
              if (i.videoUrl != null) 'videoUrl': i.videoUrl,
              if (i.targetRate != null) 'targetRate': i.targetRate,
              if (i.declaredValue != null) 'declaredValue': i.declaredValue,
              if (i.packingVolume != null) 'packingVolume': i.packingVolume,
              'priority': _servicePriority,
            },
          )
          .toList();

      // Phase 1 payload — only routingData, items, and metadata
      final payload = {
        'routingData': {
          'sourceRegion': _sourceRegionController.text.trim(),
          'sourceCity': _sourceCityController.text.trim(),
          'destinationRegion': _destinationRegionController.text.trim(),
          'destinationCity': _destinationCityController.text.trim(),
        },
        'items': items,
        'cargoType': _cargoType,
        'serviceType': _servicePriority,
        'specialInstructions':
            'Mode: $_shippingMode'
            '${_notesController.text.trim().isNotEmpty ? '\nNotes: ${_notesController.text.trim()}' : ''}',
      };

      await ref.read(quotationRepositoryProvider).createQuotation(payload);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              '✓ Request submitted! Admin will review and price it for you.',
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
        // Invalidate quotation lists so they refresh
        ref.invalidate(quotationsProvider);
        ref.invalidate(draftsProvider);
        context.go('/quotation');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardVisible = bottomInset > 0;
    final contentBottomPadding = isKeyboardVisible ? bottomInset + 160 : 160.0;

    ref.listen<ShipmentFormState>(shipmentFormProvider, (previous, next) {
      if (next.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.error!), backgroundColor: Colors.red),
        );
      }
    });

    final formState = ref.watch(shipmentFormProvider);
    final formNotifier = ref.read(shipmentFormProvider.notifier);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: BlueBackgroundScaffold(
        drawer: const AppDrawer(),
        body: Stack(
          children: [
            // ── Scrollable Content ──
            Positioned.fill(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    SizedBox(height: MediaQuery.of(context).padding.top + 70),
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
                        MediaQuery.of(context).size.width < 380 ? 16 : 24,
                        30,
                        MediaQuery.of(context).size.width < 380 ? 16 : 24,
                        contentBottomPadding,
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // ── Header ──
                            Text(
                              widget.existingQuotation != null
                                  ? 'Edit Request'
                                  : 'New Shipment Request',
                              style: Theme.of(context).textTheme.headlineSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.textDark,
                                  ),
                            ).animate().fadeIn(delay: 50.ms).slideX(),
                            const SizedBox(height: 4),
                            Text(
                              'Tell us where you\'re shipping from and to. '
                              'Exact addresses are collected after we price the quote.',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: AppTheme.textGrey),
                            ).animate().fadeIn(delay: 80.ms),
                            const SizedBox(height: 28),

                            // ── SECTION 1: Shipping Mode ──
                            _buildSectionTitle(
                              'Shipping Mode',
                            ).animate().fadeIn(delay: 100.ms),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                _buildModeChip('By Air', Icons.flight),
                                const SizedBox(width: 12),
                                _buildModeChip('By Sea', Icons.directions_boat),
                              ],
                            ).animate().fadeIn(delay: 130.ms),
                            const SizedBox(height: 24),

                            // ── SECTION 2: Routing (Region / City only) ──
                            _buildSectionTitle(
                              'Route',
                            ).animate().fadeIn(delay: 160.ms),
                            const SizedBox(height: 12),

                            // Origin row
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppTheme.background,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: AppTheme.primaryBlue.withValues(
                                    alpha: 0.15,
                                  ),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.trip_origin,
                                        color: AppTheme.primaryBlue,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Origin',
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleSmall
                                            ?.copyWith(
                                              color: AppTheme.primaryBlue,
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildTextField(
                                          label: 'Region / State',
                                          hint: 'e.g. Maharashtra',
                                          controller: _sourceRegionController,
                                          icon: Icons.public_outlined,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: _buildTextField(
                                          label: 'City',
                                          hint: 'e.g. Mumbai',
                                          controller: _sourceCityController,
                                          icon: Icons.location_city_outlined,
                                          validator: (v) => v?.isEmpty == true
                                              ? 'Required'
                                              : null,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(delay: 180.ms),
                            const SizedBox(height: 8),

                            // Arrow
                            Center(
                              child: Icon(
                                Icons.keyboard_double_arrow_down,
                                color: AppTheme.textGrey.withValues(alpha: 0.5),
                              ),
                            ),
                            const SizedBox(height: 8),

                            // Destination row
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppTheme.background,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: Colors.green.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.place,
                                        color: Colors.green.shade700,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Destination',
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleSmall
                                            ?.copyWith(
                                              color: Colors.green.shade700,
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildTextField(
                                          label: 'Region / State',
                                          hint: 'e.g. Karnataka',
                                          controller:
                                              _destinationRegionController,
                                          icon: Icons.public_outlined,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: _buildTextField(
                                          label: 'City',
                                          hint: 'e.g. Bangalore',
                                          controller:
                                              _destinationCityController,
                                          icon: Icons.location_city_outlined,
                                          validator: (v) => v?.isEmpty == true
                                              ? 'Required'
                                              : null,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(delay: 200.ms),
                            const SizedBox(height: 24),

                            // ── SECTION 3: Cargo Type ──
                            _buildSectionTitle(
                              'Cargo Type',
                            ).animate().fadeIn(delay: 220.ms),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                              ),
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: Colors.grey.withValues(alpha: 0.3),
                                ),
                                borderRadius: BorderRadius.circular(12),
                                color: AppTheme.background,
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _cargoType,
                                  isExpanded: true,
                                  items: _cargoTypes
                                      .map(
                                        (t) => DropdownMenuItem(
                                          value: t,
                                          child: Text(t),
                                        ),
                                      )
                                      .toList(),
                                  onChanged: (v) {
                                    if (v != null) {
                                      setState(() => _cargoType = v);
                                    }
                                  },
                                ),
                              ),
                            ).animate().fadeIn(delay: 240.ms),
                            const SizedBox(height: 24),

                            // ── SECTION 4: Service Priority ──
                            _buildSectionTitle(
                              'Service Priority',
                            ).animate().fadeIn(delay: 260.ms),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildPriorityChip(
                                    'Standard',
                                    Icons.access_time,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildPriorityChip(
                                    'Express',
                                    Icons.bolt,
                                  ),
                                ),
                              ],
                            ).animate().fadeIn(delay: 270.ms),
                            const SizedBox(height: 24),

                            // ── SECTION 5: Items ──
                            _buildSectionTitle(
                              'Package Items',
                            ).animate().fadeIn(delay: 300.ms),
                            const SizedBox(height: 16),
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: formState.items.length,
                              separatorBuilder: (c, i) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final item = formState.items[index];
                                return Card(
                                  elevation: 0,
                                  color: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    side: BorderSide(
                                      color: Colors.grey.shade200,
                                    ),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 48,
                                          height: 48,
                                          decoration: BoxDecoration(
                                            color: AppTheme.primaryBlue
                                                .withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                          ),
                                          child: const Icon(
                                            Icons.inventory_2_outlined,
                                            color: AppTheme.primaryBlue,
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                item.description.isNotEmpty
                                                    ? item.description
                                                    : 'Item ${index + 1}',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 15,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                '${item.quantity} pcs · ${item.weight} kg'
                                                '${item.packingVolume != null ? ' · ${item.packingVolume} CBM' : ''}',
                                                style: TextStyle(
                                                  color: Colors.grey.shade600,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(
                                            Icons.edit_outlined,
                                            color: Colors.blue,
                                          ),
                                          onPressed: () => _showItemModal(
                                            context,
                                            index: index,
                                            item: item,
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(
                                            Icons.delete_outline,
                                            color: Colors.red,
                                          ),
                                          onPressed: () {
                                            final deletedItem = item;
                                            formNotifier.removeItem(index);
                                            ScaffoldMessenger.of(context)
                                              ..clearSnackBars()
                                              ..showSnackBar(
                                                SnackBar(
                                                  content: const Text(
                                                    'Item removed',
                                                  ),
                                                  action: SnackBarAction(
                                                    label: 'UNDO',
                                                    onPressed: () =>
                                                        formNotifier.insertItem(
                                                          index,
                                                          deletedItem,
                                                        ),
                                                  ),
                                                  duration: const Duration(
                                                    seconds: 4,
                                                  ),
                                                ),
                                              );
                                          },
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ).animate().fadeIn(delay: 350.ms),

                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                onPressed: () => _showItemModal(context),
                                icon: const Icon(Icons.add),
                                label: Text(
                                  formState.items.isEmpty
                                      ? 'Add Item'
                                      : 'Add Another Item',
                                ),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppTheme.primaryBlue,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  side: const BorderSide(
                                    color: AppTheme.primaryBlue,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),

                            // ── SECTION 6: Special Instructions ──
                            _buildSectionTitle(
                              'Special Instructions',
                            ).animate().fadeIn(delay: 380.ms),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _notesController,
                              maxLines: 3,
                              decoration: InputDecoration(
                                hintText:
                                    'Any special handling, fragility notes, deadlines...',
                                hintStyle: TextStyle(
                                  color: Colors.grey.shade400,
                                  fontSize: 13,
                                ),
                                filled: true,
                                fillColor: AppTheme.background,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: Colors.grey.withValues(alpha: 0.3),
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: Colors.grey.withValues(alpha: 0.3),
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(
                                    color: AppTheme.primaryBlue,
                                    width: 2,
                                  ),
                                ),
                                contentPadding: const EdgeInsets.all(16),
                              ),
                            ).animate().fadeIn(delay: 400.ms),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── AppBar ──
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 8,
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(
                          Icons.arrow_back,
                          color: Colors.white,
                          size: 26,
                        ),
                        onPressed: () => context.pop(),
                      ),
                      const Expanded(
                        child: Text(
                          'Create Request',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
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
            width: MediaQuery.of(context).size.width * 0.75,
            height: 52,
            child: FloatingActionButton.extended(
              onPressed: _isSubmitting ? null : _submitRequest,
              backgroundColor: AppTheme.primaryBlue,
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
              ),
              icon: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : const Icon(
                      Icons.send_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
              label: Text(
                _isSubmitting ? 'Submitting...' : 'SUBMIT REQUEST',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                  fontSize: 15,
                ),
              ),
            ),
          ),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      ),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w700,
        color: AppTheme.textDark,
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String hint,
    required TextEditingController controller,
    required IconData icon,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: AppTheme.textGrey,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          validator: validator,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, color: AppTheme.primaryBlue, size: 18),
            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
            filled: true,
            fillColor: AppTheme.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: AppTheme.primaryBlue,
                width: 1.5,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppTheme.error),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 14,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildModeChip(String label, IconData icon) {
    final selected = _shippingMode == label;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _shippingMode = label),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            color: selected
                ? AppTheme.primaryBlue.withValues(alpha: 0.1)
                : AppTheme.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppTheme.primaryBlue : Colors.grey.shade300,
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: selected ? AppTheme.primaryBlue : Colors.grey.shade500,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: selected ? AppTheme.primaryBlue : Colors.grey.shade700,
                  fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriorityChip(String label, IconData icon) {
    final selected = _servicePriority == label;
    return GestureDetector(
      onTap: () => setState(() => _servicePriority = label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? Colors.orange.withValues(alpha: 0.1)
              : AppTheme.background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? Colors.orange : Colors.grey.shade300,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: selected ? Colors.orange : Colors.grey.shade500,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.orange : Colors.grey.shade700,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showItemModal(
    BuildContext context, {
    int? index,
    ShipmentItemFormData? item,
  }) {
    final formNotifier = ref.read(shipmentFormProvider.notifier);
    // Initialize a local mutable copy for the modal
    ShipmentItemFormData localItem =
        item ??
        ShipmentItemFormData(
          description: '',
          quantity: 1,
          weight: 0,
          dimensions: '',
          images: const [],
          category: 'General',
          isHazardous: false,
        );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.5),
      builder: (context) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
          child: DraggableScrollableSheet(
            initialChildSize: 0.85,
            maxChildSize: 0.95,
            minChildSize: 0.5,
            builder: (context, scrollController) {
              return Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
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
                    const SizedBox(height: 4),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                      child: Row(
                        children: [
                          Text(
                            index == null ? 'Add Item' : 'Edit Item',
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.bold),
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
                    Expanded(
                      child: StatefulBuilder(
                        builder: (ctx, setModalState) {
                          return SingleChildScrollView(
                            controller: scrollController,
                            padding: EdgeInsets.fromLTRB(
                              20,
                              20,
                              20,
                              MediaQuery.of(context).viewInsets.bottom + 20,
                            ),
                            child: Column(
                              children: [
                                ShipmentItemForm(
                                  index: index ?? 0,
                                  item: localItem,
                                  onChanged: (updated) {
                                    setModalState(() => localItem = updated);
                                  },
                                  onRemove: () => Navigator.pop(context),
                                ),
                                const SizedBox(height: 16),
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
                                    onPressed: () {
                                      if (index != null) {
                                        formNotifier.updateItem(
                                          index,
                                          localItem,
                                        );
                                      } else {
                                        formNotifier.addItem(localItem);
                                      }
                                      Navigator.pop(context);
                                    },
                                    child: Text(
                                      index == null
                                          ? 'ADD ITEM'
                                          : 'SAVE CHANGES',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 24),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}
