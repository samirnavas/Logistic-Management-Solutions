import 'package:bb_logistics/src/core/api/upload_service.dart';
import 'package:bb_logistics/src/core/widgets/app_drawer.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/features/shipment/presentation/shipment_form_notifier.dart';
import 'package:bb_logistics/src/features/shipment/presentation/widgets/shipment_item_form.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:bb_logistics/src/features/quotation/data/quotation_repository.dart';
import 'package:bb_logistics/src/features/home/data/dashboard_repository.dart';
import 'package:bb_logistics/src/features/quotation/domain/quotation.dart';

import 'package:bb_logistics/src/features/shipment/data/warehouse_repository.dart';

class RequestShipmentScreen extends ConsumerStatefulWidget {
  final Quotation? existingQuotation;
  const RequestShipmentScreen({super.key, this.existingQuotation});

  @override
  ConsumerState<RequestShipmentScreen> createState() =>
      _RequestShipmentScreenState();
}

class _RequestShipmentScreenState extends ConsumerState<RequestShipmentScreen> {
  final _formKey = GlobalKey<FormState>();
  String _shippingMode = 'By Air';
  String _servicePriority = 'Standard';
  String _countryCode = '+91'; // Default India

  // Controllers for Pickup Address
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _countryController = TextEditingController();
  final _zipController = TextEditingController();
  final _addressTypeController = TextEditingController();
  final _notesController = TextEditingController();

  // Controllers for Destination Address
  final _destNameController = TextEditingController();
  final _destPhoneController = TextEditingController();
  final _destAddressController = TextEditingController();
  final _destCityController = TextEditingController();
  final _destStateController = TextEditingController();
  final _destCountryController = TextEditingController();
  final _destZipController = TextEditingController();

  String? _selectedOriginWarehouseId;
  String? _selectedDestinationWarehouseId;

  final Map<String, String> _serviceModeLabels = {
    'door_to_door': 'Door to Door',
    'door_to_warehouse': 'Door to Warehouse',
    'warehouse_to_door': 'Warehouse to Door',
    'warehouse_to_warehouse': 'Warehouse to Warehouse',
  };

  final UploadService _uploadService = UploadService();

  @override
  void initState() {
    super.initState();
    if (widget.existingQuotation != null) {
      final q = widget.existingQuotation!;
      _shippingMode = q.specialInstructions?.contains('Mode: By Sea') ?? false
          ? 'By Sea'
          : 'By Air'; // Simple parsing or add field
      // Better: check q.serviceType or parse specialInstructions if mode not stored explicitly
      // Assuming defaults or parsing from specialInstructions as implemented in submit
      if (q.specialInstructions != null) {
        if (q.specialInstructions!.contains('Mode: By Sea')) {
          _shippingMode = 'By Sea';
        }
        if (q.specialInstructions!.contains('Delivery: Warehouse Delivery')) {
          // Legacy handling or ignore
        }
        // Extract notes? "Notes: ..."
        final notesIndex = q.specialInstructions!.indexOf('Notes: ');
        if (notesIndex != -1) {
          _notesController.text = q.specialInstructions!.substring(
            notesIndex + 7,
          );
        }
      }

      if (q.serviceMode != null) {
        Future.microtask(() {
          if (mounted) {
            ref
                .read(shipmentFormProvider.notifier)
                .setServiceMode(q.serviceMode!);
          }
        });
      }

      _servicePriority = q.serviceType ?? 'Standard';

      if (q.origin != null) {
        _nameController.text = q.origin!.name;
        // Parse phone if needed or just set
        // Phone format was: countryCode phone. Split?
        // Simple heuristic:
        if (q.origin!.phone.contains(' ')) {
          final parts = q.origin!.phone.split(' ');
          if (parts.length > 1) {
            _countryCode = parts[0];
            _phoneController.text = parts.sublist(1).join(' ');
          } else {
            _phoneController.text = q.origin!.phone;
          }
        } else {
          _phoneController.text = q.origin!.phone;
        }

        _addressController.text = q.origin!.addressLine;
        _cityController.text = q.origin!.city;
        _stateController.text = q.origin!.state;
        _countryController.text = q.origin!.country;
        _zipController.text = q.origin!.zip;
        // Address type might not be in QuotationAddress?
        // Actually backend stores it in origin? No, QuotationAddress struct doesn't have it.
        // It uses 'addressType' in simple object but QuotationAddress class defined in domain handles specific fields.
        // If domain definition missed it, we assume blank or add it.
        // Domain has name, phone, addressLine, city, state, country, zip.
        // We'll leave Address Type blank or "Default".
      }

      // Pre-fill items
      final items = q.items.map((i) {
        return ShipmentItemFormData(
          description: i.description,
          quantity: i.quantity,
          weight: i.weight,
          dimensions: i.dimensions,
          images: i.images, // Cloudinary URLs
          category: i.category,
          isHazardous: i.isHazardous,
          hsCode: '', // Not in QuotationItem?
          videoUrl: i.videoUrl,
          targetRate: i.targetRate,
          declaredValue: i.declaredValue,
          packingVolume: i.packingVolume,
          cost: i.cost,
        );
      }).toList();

      Future.microtask(() {
        if (mounted) {
          ref.read(shipmentFormProvider.notifier).setItems(items);
        }
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _countryController.dispose();
    _zipController.dispose();
    _addressTypeController.dispose();
    _destNameController.dispose();
    _destPhoneController.dispose();
    _destAddressController.dispose();
    _destCityController.dispose();
    _destStateController.dispose();
    _destCountryController.dispose();
    _destZipController.dispose();
    _notesController.dispose();
    // Manual dispose to clear form state when leaving
    // This allows us to use a regular Provider (avoiding Hot Reload errors)
    // while still clearing data on back navigation.
    // However, calling invalidate in dispose might trigger rebuilds on listeners that are disposing.
    // A better way is to check mounted or use invalidate.
    // Actually, invalidate clears the state.

    // We can't use 'ref' in dispose() directly because it might be detached?
    // No, ConsumerState usually allows it but it's risky.
    // Let's rely on the fact that if we navigate away, the widget is unmounted.
    // Wait, invalidate resets the provider state immediately.
    // Let's wrap in a microtask or just call it.

    super.dispose();
  }

  @override
  void deactivate() {
    // Invalidate here to be safe?
    // Or rely on autoDispose but we can't switch types easily.
    // Let's try invalidate in dispose for now, usually safe for global providers.
    ref.invalidate(shipmentFormProvider);
    super.deactivate();
  }

  Future<void> _selectAddress({required bool isPickup}) async {
    final result = await context.pushNamed(
      'addAddress', // Using named route added to app_router.dart
      pathParameters: {
        'id': 'new',
      }, // Dummy ID since we're not binding to a specific quotation yet
      extra: {'isPickup': isPickup, 'fromShipmentFlow': true},
    );

    if (result != null && result is Map<String, dynamic>) {
      setState(() {
        if (isPickup) {
          final origin = result['origin'] as Map<String, dynamic>?;
          if (origin != null) {
            _nameController.text = origin['name'] ?? '';
            // Handle phone - remove country code if doubled?
            // AddAddressScreen returns full phone. RequestScreen usually composes it.
            // For now, put full phone in controller and let user adjust or backend handle.
            _phoneController.text = origin['phone'] ?? '';
            _addressController.text = origin['addressLine'] ?? '';
            _cityController.text = origin['city'] ?? '';
            _stateController.text = origin['state'] ?? '';
            _countryController.text = origin['country'] ?? '';
            _zipController.text = origin['zip'] ?? '';
          }
        } else {
          final dest = result['destination'] as Map<String, dynamic>?;
          if (dest != null) {
            _destNameController.text = dest['name'] ?? '';
            _destPhoneController.text = dest['phone'] ?? '';
            _destAddressController.text = dest['addressLine'] ?? '';
            _destCityController.text = dest['city'] ?? '';
            _destStateController.text = dest['state'] ?? '';
            _destCountryController.text = dest['country'] ?? '';
            _destZipController.text = dest['zip'] ?? '';
          }
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Check if keyboard is visible
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardVisible = bottomInset > 0;

    // Calculate bottom padding for content so it clears the floaty button
    final contentBottomPadding = isKeyboardVisible ? bottomInset + 160 : 160.0;

    ref.listen<ShipmentFormState>(shipmentFormProvider, (previous, next) {
      if (next.successMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.successMessage!),
            backgroundColor: Colors.green,
          ),
        );
      }
      if (next.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.error!), backgroundColor: Colors.red),
        );
      }
    });

    final formState = ref.watch(shipmentFormProvider);
    final formNotifier = ref.read(shipmentFormProvider.notifier);
    final warehousesAsync = ref.watch(warehousesProvider);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: BlueBackgroundScaffold(
        drawer: const AppDrawer(),
        body: Stack(
          children: [
            // 1. Scrollable Content
            Positioned.fill(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    SizedBox(
                      height: MediaQuery.of(context).padding.top + 70,
                    ), // Dynamic margin to show header initially
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
                            // Info Required Banner
                            if (widget.existingQuotation?.status ==
                                QuotationStatus.infoRequired)
                              Container(
                                margin: const EdgeInsets.only(bottom: 24),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.red[50],
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.red[200]!),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.info_outline,
                                          color: Colors.red,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Action Required',
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleMedium
                                              ?.copyWith(
                                                color: Colors.red[800],
                                                fontWeight: FontWeight.bold,
                                              ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      widget.existingQuotation?.adminFeedback ??
                                          widget
                                              .existingQuotation
                                              ?.additionalNotes ??
                                          'Please update the request details.',
                                      style: TextStyle(
                                        color: Colors.red[900],
                                        height: 1.4,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                            // 1. Shipping Mode
                            _buildSectionTitle(
                              'Choose Shipping Mode',
                            ).animate().fadeIn(delay: 100.ms).slideX(),
                            const SizedBox(height: 12),
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  _buildRadioOption('By Air', _shippingMode, (
                                    val,
                                  ) {
                                    setState(() => _shippingMode = val!);
                                  }),
                                  const SizedBox(width: 24),
                                  _buildRadioOption('By Sea', _shippingMode, (
                                    val,
                                  ) {
                                    setState(() => _shippingMode = val!);
                                  }),
                                ],
                              ),
                            ).animate().fadeIn(delay: 150.ms).slideX(),
                            const SizedBox(height: 24),

                            // 2. Service Mode (Replaces Delivery Type)
                            _buildSectionTitle(
                              'Service Mode',
                            ).animate().fadeIn(delay: 200.ms).slideX(),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                              ),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey[300]!),
                                borderRadius: BorderRadius.circular(12),
                                color: AppTheme.background,
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: formState.selectedServiceMode,
                                  isExpanded: true,
                                  items: _serviceModeLabels.entries.map((e) {
                                    return DropdownMenuItem(
                                      value: e.key,
                                      child: Text(e.value),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      formNotifier.setServiceMode(val);
                                    }
                                  },
                                ),
                              ),
                            ).animate().fadeIn(delay: 250.ms).slideX(),
                            const SizedBox(height: 24),

                            // 2.5 Service Priority
                            _buildSectionTitle(
                              'Service Priority',
                            ).animate().fadeIn(delay: 275.ms).slideX(),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildRadioOption(
                                    'Standard',
                                    _servicePriority,
                                    (val) =>
                                        setState(() => _servicePriority = val!),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildRadioOption(
                                    'Express',
                                    _servicePriority,
                                    (val) =>
                                        setState(() => _servicePriority = val!),
                                  ),
                                ),
                              ],
                            ).animate().fadeIn(delay: 275.ms).slideX(),
                            const SizedBox(height: 24),

                            // 3. Package Details (Dynamic List)
                            _buildSectionTitle(
                              'Package Details',
                            ).animate().fadeIn(delay: 300.ms).slideX(),
                            const SizedBox(height: 16),
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: formState.items.length,
                              separatorBuilder: (context, index) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final item = formState.items[index];
                                return Card(
                                  elevation: 0,
                                  color: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    side: BorderSide(color: Colors.grey[200]!),
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
                                                  fontSize: 16,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                '${item.quantity} Boxes • ${item.weight} kg${item.packingVolume != null ? ' • ${item.packingVolume} CBM' : ''}',
                                                style: TextStyle(
                                                  color: Colors.grey[600],
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
                                        if (formState.items.isNotEmpty)
                                          IconButton(
                                            icon: const Icon(
                                              Icons.delete_outline,
                                              color: Colors.red,
                                            ),
                                            onPressed: () {
                                              final deletedItem = item;
                                              final deletedIndex = index;
                                              formNotifier.removeItem(index);

                                              ScaffoldMessenger.of(
                                                context,
                                              ).clearSnackBars();
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                SnackBar(
                                                  content: const Text(
                                                    'Item deleted',
                                                  ),
                                                  action: SnackBarAction(
                                                    label: 'UNDO',
                                                    onPressed: () {
                                                      formNotifier.insertItem(
                                                        deletedIndex,
                                                        deletedItem,
                                                      );
                                                    },
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
                            // Create a full-width container to center the button properly
                            Container(
                              width: double.infinity,
                              alignment: Alignment.center,
                              child: OutlinedButton(
                                onPressed: () {
                                  _showItemModal(context);
                                },
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppTheme.primaryBlue,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 12,
                                  ),
                                  side: const BorderSide(
                                    color: AppTheme.primaryBlue,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment
                                      .center, // Ensure vertical center
                                  children: [
                                    const Icon(Icons.add),
                                    const SizedBox(width: 8),
                                    Text(
                                      formState.items.isEmpty
                                          ? 'Add Item'
                                          : 'Add Another Item',
                                      style: const TextStyle(
                                        height:
                                            1.2, // Fix line height alignment
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            const SizedBox(height: 24),

                            const SizedBox(height: 24),

                            // 5. Origin Details (Conditional)
                            if (formState.selectedServiceMode.startsWith(
                              'door',
                            )) ...[
                              _buildSectionTitle('Pickup Address'),
                              const SizedBox(height: 16),
                              if (_nameController.text.isNotEmpty)
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: Colors.grey[300]!,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                    color: Colors.grey[50],
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              _nameController.text,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 16,
                                              ),
                                            ),
                                          ),
                                          TextButton(
                                            onPressed: () =>
                                                _selectAddress(isPickup: true),
                                            child: const Text('Change'),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.phone,
                                            size: 16,
                                            color: Colors.grey,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            _phoneController
                                                .text, // Assuming full phone from selection
                                            style: TextStyle(
                                              color: Colors.grey[700],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          const Icon(
                                            Icons.location_on,
                                            size: 16,
                                            color: Colors.grey,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              '${_addressController.text}, ${_cityController.text}, ${_stateController.text} ${_zipController.text}, ${_countryController.text}',
                                              style: TextStyle(
                                                color: Colors.grey[700],
                                                height: 1.3,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                )
                              else
                                OutlinedButton.icon(
                                  onPressed: () =>
                                      _selectAddress(isPickup: true),
                                  icon: const Icon(
                                    Icons.add_location_alt_outlined,
                                  ),
                                  label: const Text('Add Pickup Address'),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 16,
                                    ),
                                    side: BorderSide(color: Colors.grey[300]!),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    minimumSize: const Size(double.infinity, 0),
                                    foregroundColor: AppTheme.primaryBlue,
                                  ),
                                ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                hint: 'Address Type (e.g. Home, Office)',
                                controller: _addressTypeController,
                              ),
                            ] else ...[
                              _buildSectionTitle('Origin Warehouse'),
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                ),
                                decoration: BoxDecoration(
                                  border: Border.all(color: Colors.grey[300]!),
                                  borderRadius: BorderRadius.circular(16),
                                  color: AppTheme.background,
                                ),
                                child: warehousesAsync.when(
                                  data: (warehouses) =>
                                      DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _selectedOriginWarehouseId,
                                          hint: const Text(
                                            'Select Origin Warehouse',
                                          ),
                                          isExpanded: true,
                                          items: warehouses.map((w) {
                                            return DropdownMenuItem(
                                              value: w.id,
                                              child: Text(
                                                '${w.name} (${w.code})',
                                              ),
                                            );
                                          }).toList(),
                                          onChanged: (val) {
                                            setState(
                                              () => _selectedOriginWarehouseId =
                                                  val,
                                            );
                                          },
                                        ),
                                      ),
                                  loading: () => const Center(
                                    child: Padding(
                                      padding: EdgeInsets.all(12.0),
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    ),
                                  ),
                                  error: (err, _) => const Center(
                                    child: Text('Error loading warehouses'),
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 24),

                            // 6. Destination Details (Conditional)
                            if (formState.selectedServiceMode.endsWith(
                              'door',
                            )) ...[
                              _buildSectionTitle('Destination Address'),
                              const SizedBox(height: 16),
                              if (_destNameController.text.isNotEmpty)
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: Colors.grey[300]!,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                    color: Colors.grey[50],
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              _destNameController.text,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 16,
                                              ),
                                            ),
                                          ),
                                          TextButton(
                                            onPressed: () =>
                                                _selectAddress(isPickup: false),
                                            child: const Text('Change'),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.phone,
                                            size: 16,
                                            color: Colors.grey,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            _destPhoneController.text,
                                            style: TextStyle(
                                              color: Colors.grey[700],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          const Icon(
                                            Icons.location_on,
                                            size: 16,
                                            color: Colors.grey,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              '${_destAddressController.text}, ${_destCityController.text}, ${_destStateController.text} ${_destZipController.text}, ${_destCountryController.text}',
                                              style: TextStyle(
                                                color: Colors.grey[700],
                                                height: 1.3,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                )
                              else
                                OutlinedButton.icon(
                                  onPressed: () =>
                                      _selectAddress(isPickup: false),
                                  icon: const Icon(
                                    Icons.add_location_alt_outlined,
                                  ),
                                  label: const Text('Add Delivery Address'),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 16,
                                    ),
                                    side: BorderSide(color: Colors.grey[300]!),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    minimumSize: const Size(double.infinity, 0),
                                    foregroundColor: AppTheme.primaryBlue,
                                  ),
                                ),
                            ] else ...[
                              _buildSectionTitle('Destination Warehouse'),
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                ),
                                decoration: BoxDecoration(
                                  border: Border.all(color: Colors.grey[300]!),
                                  borderRadius: BorderRadius.circular(16),
                                  color: AppTheme.background,
                                ),
                                child: warehousesAsync.when(
                                  data: (warehouses) =>
                                      DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value:
                                              _selectedDestinationWarehouseId,
                                          hint: const Text(
                                            'Select Destination Warehouse',
                                          ),
                                          isExpanded: true,
                                          items: warehouses.map((w) {
                                            return DropdownMenuItem(
                                              value: w.id,
                                              child: Text(
                                                '${w.name} (${w.code})',
                                              ),
                                            );
                                          }).toList(),
                                          onChanged: (val) {
                                            setState(
                                              () =>
                                                  _selectedDestinationWarehouseId =
                                                      val,
                                            );
                                          },
                                        ),
                                      ),
                                  loading: () => const Center(
                                    child: Padding(
                                      padding: EdgeInsets.all(12.0),
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    ),
                                  ),
                                  error: (err, _) => const Center(
                                    child: Text('Error loading warehouses'),
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 24),

                            // 6. Notes
                            _buildSectionTitle('Add Notes'),
                            const SizedBox(height: 16),
                            _buildTextField(
                              hint: 'Add special instructions...',
                              controller: _notesController,
                              maxLines: 4,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 2. Custom App Bar Content (Back Button & Title)
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
                    children: [
                      IconButton(
                        icon: const Icon(
                          Icons.arrow_back_ios,
                          color: Colors.white,
                          size: 20,
                        ),
                        onPressed: () {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/home');
                          }
                        },
                      ), // Back Button
                      const SizedBox(width: 8),
                      Text(
                        widget.existingQuotation != null
                            ? 'Edit Request'
                            : 'New Shipment Request',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontSize: 20,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Floating Button
            AnimatedPositioned(
              duration: const Duration(milliseconds: 100),
              curve: Curves.easeOut,
              left: 24, // Add horizontal padding
              right: 24, // Add horizontal padding
              // Float 24px above bottom, or 24px above keyboard
              bottom: isKeyboardVisible ? 12 : 32,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Save as Draft Button
                  SizedBox(
                    height: 48,
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _saveDraft,
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.primaryBlue),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        backgroundColor: Colors.white,
                      ),
                      child: const Text(
                        'Save as Draft',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryBlue,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Submit Button
                  SizedBox(
                    height: 56,
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _submitRequest,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryBlue,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        elevation: 5, // Add elevation for floating effect
                        shadowColor: Colors.black.withValues(alpha: 0.3),
                      ),
                      child: Text(
                        'SUBMIT REQUEST',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 1,
                            ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _saveDraft() async {
    // Collect Form Data without strict validation

    // Get current user
    final authState = ref.read(authRepositoryProvider);
    final user = authState.value;
    if (user == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('User not logged in')));
      return;
    }

    // Show loading indicator handled by Notifier state listener or local
    // Since notifier takes care of API call, we just pass data.
    // But notifier state change will trigger rebuild/listener.
    // However, image upload is local here.

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final serviceMode = ref.read(shipmentFormProvider).selectedServiceMode;

      // Get warehouses list synchronously
      final warehouses = ref.read(warehousesProvider).value ?? [];

      // Construct Origin
      Map<String, dynamic> pickupAddress;
      if (serviceMode.startsWith('door')) {
        pickupAddress = {
          'name': _nameController.text,
          'phone': '$_countryCode ${_phoneController.text}',
          'addressLine': _addressController.text,
          'city': _cityController.text,
          'state': _stateController.text,
          'country': _countryController.text,
          'zip': _zipController.text,
          'addressType': _addressTypeController.text,
        };
      } else {
        final warehouse = warehouses.firstWhere(
          (w) => w.id == _selectedOriginWarehouseId,
          orElse: () => warehouses.first,
        );
        pickupAddress = {
          'name': warehouse.name,
          'phone': 'N/A',
          'addressLine': warehouse.address.addressLine,
          'city': warehouse.address.city,
          'state': warehouse.address.state,
          'country': warehouse.address.country,
          'zip': warehouse.address.zip,
          'addressType': 'Warehouse',
        };
      }

      // Construct Destination
      Map<String, dynamic> destinationAddress;
      if (serviceMode.endsWith('door')) {
        destinationAddress = {
          'name': _destNameController.text,
          'phone': '$_countryCode ${_destPhoneController.text}',
          'addressLine': _destAddressController.text,
          'city': _destCityController.text,
          'state': _destStateController.text,
          'country': _destCountryController.text,
          'zip': _destZipController.text,
          'addressType': 'Delivery Address',
        };
      } else {
        final warehouse = warehouses.firstWhere(
          (w) => w.id == _selectedDestinationWarehouseId,
          orElse: () => warehouses.first,
        );
        destinationAddress = {
          'name': warehouse.name,
          'phone': 'N/A',
          'addressLine': warehouse.address.addressLine,
          'city': warehouse.address.city,
          'state': warehouse.address.state,
          'country': warehouse.address.country,
          'zip': warehouse.address.zip,
          'addressType': 'Warehouse',
        };
      }

      final formState = ref.read(shipmentFormProvider);
      List<Map<String, dynamic>> processedItems = [];

      for (final item in formState.items) {
        List<String> uploadedPhotoUrls = [];
        if (item.localPhotos.isNotEmpty) {
          try {
            uploadedPhotoUrls = await _uploadService.uploadProductPhotos(
              item.localPhotos,
            );
          } catch (e) {
            debugPrint(
              "Error uploading photos for item ${item.description}: $e",
            );
          }
        }

        processedItems.add({
          'description': item.description,
          'quantity': item.quantity,
          'weight': item.weight,
          'dimensions': item.dimensions,
          'images': uploadedPhotoUrls,
          'category': item.category,
          'isHazardous': item.isHazardous,
          'hsCode': item.hsCode,
          'videoUrl': item.videoUrl,
          'targetRate': item.targetRate,
          'declaredValue': item.declaredValue,
          'packingVolume': item.packingVolume,
          'unitPrice': 0,
          'amount': 0,
        });
      }

      final requestData = {
        'origin': pickupAddress,
        'destination': destinationAddress,
        'items': processedItems,
        'cargoType': 'General Cargo',
        'serviceMode': serviceMode,
        'serviceType': _servicePriority,
        'specialInstructions':
            'Mode: $_shippingMode\nNotes: ${_notesController.text}',
        'pickupDate': DateTime.now()
            .add(const Duration(days: 1))
            .toIso8601String(),
        // Add status or other flags if needed, but endpoint defaults to DRAFT usually
        // or we can pass status: 'DRAFT' if backend supports it.
        // But reusing saveAsDraft endpoint in repo which likely sets it.
      };

      await ref.read(shipmentFormProvider.notifier).saveDraft(requestData);

      if (mounted) Navigator.of(context).pop(); // Dismiss loading
    } catch (e) {
      if (mounted) Navigator.of(context).pop();
      // Error handled by listener
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to prepare draft: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all required fields.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Check items
    final formState = ref.read(shipmentFormProvider);
    if (formState.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one item.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Check validation of individual items
    for (final item in formState.items) {
      if (item.description.isEmpty || item.quantity <= 0 || item.weight <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Please complete all item details (Name, Qty, Weight are required).',
            ),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    }

    // Get current user
    final authState = ref.read(authRepositoryProvider);
    final user = authState.value;
    if (user == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('User not logged in')));
      return;
    }

    try {
      // Show loading indicator
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final serviceMode = formState.selectedServiceMode;

      // Get warehouses list synchronously (it should be loaded)
      final warehouses = ref.read(warehousesProvider).value ?? [];

      // Validate Warehouse selections
      if (serviceMode.startsWith('warehouse') &&
          (_selectedOriginWarehouseId == null ||
              _selectedOriginWarehouseId!.isEmpty)) {
        Navigator.pop(context); // Dismiss loading
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select an Origin Warehouse'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
      if (serviceMode.endsWith('warehouse') &&
          (_selectedDestinationWarehouseId == null ||
              _selectedDestinationWarehouseId!.isEmpty)) {
        Navigator.pop(context); // Dismiss loading
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select a Destination Warehouse'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      Map<String, dynamic> pickupAddress;
      if (serviceMode.startsWith('door')) {
        pickupAddress = {
          'name': _nameController.text,
          'phone': '$_countryCode ${_phoneController.text}',
          'addressLine': _addressController.text,
          'city': _cityController.text,
          'state': _stateController.text,
          'country': _countryController.text,
          'zip': _zipController.text,
          'addressType': _addressTypeController.text,
        };
      } else {
        final warehouse = warehouses.firstWhere(
          (w) => w.id == _selectedOriginWarehouseId,
          orElse: () => warehouses.first,
        );
        pickupAddress = {
          'name': warehouse.name,
          'phone': 'N/A',
          'addressLine': warehouse.address.addressLine,
          'city': warehouse.address.city,
          'state': warehouse.address.state,
          'country': warehouse.address.country,
          'zip': warehouse.address.zip,
          'addressType': 'Warehouse',
        };
      }

      Map<String, dynamic> destinationAddress;
      if (serviceMode.endsWith('door')) {
        destinationAddress = {
          'name': _destNameController.text,
          'phone': '$_countryCode ${_destPhoneController.text}',
          'addressLine': _destAddressController.text,
          'city': _destCityController.text,
          'state': _destStateController.text,
          'country': _destCountryController.text,
          'zip': _destZipController.text,
          'addressType': 'Delivery Address',
        };
      } else {
        final warehouse = warehouses.firstWhere(
          (w) => w.id == _selectedDestinationWarehouseId,
          orElse: () => warehouses.first,
        );
        destinationAddress = {
          'name': warehouse.name,
          'phone': 'N/A',
          'addressLine': warehouse.address.addressLine,
          'city': warehouse.address.city,
          'state': warehouse.address.state,
          'country': warehouse.address.country,
          'zip': warehouse.address.zip,
          'addressType': 'Warehouse',
        };
      }

      // Process Items including photo uploads
      List<Map<String, dynamic>> processedItems = [];

      for (final item in formState.items) {
        // Upload photos for this item
        List<String> uploadedPhotoUrls = [];

        // If item has local photos, upload them
        // If it already has images (from edit mode) and no new local photos, keep them.
        // If it has both, we might want to merge or just upload new ones and add to existing list.
        // Current logic: item.images are URLs. item.localPhotos are Files.
        // We upload localPhotos and ADD to images list.

        if (item.localPhotos.isNotEmpty) {
          try {
            final newUrls = await _uploadService.uploadProductPhotos(
              item.localPhotos,
            );
            uploadedPhotoUrls.addAll(newUrls);
          } catch (e) {
            debugPrint(
              "Error uploading photos for item ${item.description}: $e",
            );
          }
        }

        // Combine existing (if any) and new
        final allImages = [...item.images, ...uploadedPhotoUrls];

        processedItems.add({
          'description': item.description,
          'quantity': item.quantity,
          'weight': item.weight,
          'dimensions': item.dimensions, // Pass raw string
          'images': allImages,
          'category': item.category,
          'isHazardous': item.isHazardous,
          'hsCode': item.hsCode,
          'videoUrl': item.videoUrl,
          'targetRate': item.targetRate,
          'declaredValue': item.declaredValue,
          'packingVolume': item.packingVolume,

          // Fallback/Legacy fields
          'unitPrice': item.cost > 0
              ? item.cost
              : 0, // Preserve cost if editing
          'amount': item.cost > 0 ? item.cost : 0,
        });
      }

      final requestData = {
        'origin': pickupAddress,
        'destination': destinationAddress,
        'items': processedItems,
        'cargoType':
            'General Cargo', // Consider making this dynamic if all items are same? Or just default
        'serviceMode': serviceMode,
        'serviceType': _servicePriority, // Use global priority
        'specialInstructions':
            'Mode: $_shippingMode\nNotes: ${_notesController.text}',
        'pickupDate': DateTime.now()
            .add(const Duration(days: 1))
            .toIso8601String(), // Default to tomorrow
        'productPhotos':
            [], // Legacy top-level photos - empty now as items have them
      };

      if (widget.existingQuotation != null) {
        // Update existing
        await ref
            .read(shipmentFormProvider.notifier)
            .submitUpdate(widget.existingQuotation!.id, requestData);

        // Dismiss loading
        if (mounted) Navigator.of(context).pop();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Request updated successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          context.pop();
        }
      } else {
        await ref
            .read(quotationRepositoryProvider)
            .createQuotation(requestData);

        // Dismiss loading
        if (mounted) Navigator.of(context).pop();

        _showSuccessDialog();
      }

      // Invalidate providers to force refresh
      ref.invalidate(quotationsProvider);
      ref.invalidate(dashboardStatsProvider);
    } catch (e) {
      // Dismiss loading
      if (mounted) Navigator.of(context).pop();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit request: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(30.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              Image.asset(
                'assets/request_success_popup_image.png',
                height: 120,
                width: 120,
              ),
              const SizedBox(height: 24),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.black87,
                    height: 1.5,
                  ),
                  children: [
                    const TextSpan(text: 'Your request '),
                    TextSpan(
                      text: '#PENDING',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textDark,
                      ),
                    ),
                    const TextSpan(
                      text:
                          ' has been submitted to the Manager.\nYou will be notified once the quotation is approved and pricing is available.',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    // Navigate to Quotation Screen
                    context.go('/quotation');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBlue,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'GO TO QUOTATIONS',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showItemModal(
    BuildContext context, {
    int? index,
    ShipmentItemFormData? item,
  }) async {
    // If editing, use existing item. If new, create empty.
    ShipmentItemFormData tempItem = item ?? ShipmentItemFormData();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: StatefulBuilder(
            builder: (context, setModalState) {
              return Padding(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).viewInsets.bottom,
                  left: 16,
                  right: 16,
                  top: 16,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            index == null ? 'Add New Item' : 'Edit Item',
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          IconButton(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                      const Divider(),
                      const SizedBox(height: 16),
                      ShipmentItemForm(
                        index: index ?? -1,
                        item: tempItem,
                        onChanged: (newItem) {
                          setModalState(() {
                            tempItem = newItem;
                          });
                        },
                        onRemove: () {}, // Not used in modal
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          // Validation
                          List<String> missingFields = [];
                          if (tempItem.description.isEmpty) {
                            missingFields.add('Description');
                          }
                          if (tempItem.quantity <= 0) {
                            missingFields.add('Quantity');
                          }
                          if (tempItem.weight <= 0) {
                            missingFields.add('Weight');
                          }
                          if (tempItem.hsCode == null ||
                              tempItem.hsCode!.isEmpty) {
                            missingFields.add('HS Code');
                          }

                          if (missingFields.isNotEmpty) {
                            ScaffoldMessenger.of(
                              context,
                            ).clearSnackBars(); // Clear existing
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Please fill required fields: ${missingFields.join(', ')}',
                                ),
                                backgroundColor: Colors.red,
                                behavior: SnackBarBehavior
                                    .floating, // Improve visibility in modal
                                margin: EdgeInsets.only(
                                  bottom:
                                      MediaQuery.of(context).viewInsets.bottom +
                                      10,
                                  left: 16,
                                  right: 16,
                                ),
                              ),
                            );
                            return;
                          }

                          final notifier = ref.read(
                            shipmentFormProvider.notifier,
                          );
                          if (index == null) {
                            // Add new
                            notifier.addItem(tempItem);
                          } else {
                            // Update existing
                            notifier.updateItem(index, tempItem);
                          }
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryBlue,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          index == null ? 'ADD ITEM' : 'SAVE CHANGES',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w700,
        color: AppTheme.textDark,
      ),
    );
  }

  Widget _buildRadioOption(
    String value,
    String groupValue,
    ValueChanged<String?> onChanged,
  ) {
    final isSelected = value == groupValue;
    return InkWell(
      onTap: () => onChanged(value),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 4,
          vertical: 4,
        ), // Larger touch area
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? Colors.grey[300] : Colors.grey[200],
              ),
              padding: const EdgeInsets.all(2),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected ? Colors.grey[600] : Colors.transparent,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String hint,
    required TextEditingController controller,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      style: Theme.of(
        context,
      ).textTheme.bodyMedium?.copyWith(color: Colors.black87),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: Theme.of(
          context,
        ).textTheme.bodyMedium?.copyWith(color: Colors.grey[400], fontSize: 13),
        filled: true,
        fillColor: AppTheme.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Colors.red, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Colors.red, width: 1),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 18,
        ),
      ),
    );
  }
} // End of class
