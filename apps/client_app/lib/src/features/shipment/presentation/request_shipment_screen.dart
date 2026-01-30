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

class RequestShipmentScreen extends ConsumerStatefulWidget {
  const RequestShipmentScreen({super.key});

  @override
  ConsumerState<RequestShipmentScreen> createState() =>
      _RequestShipmentScreenState();
}

class _RequestShipmentScreenState extends ConsumerState<RequestShipmentScreen> {
  final _formKey = GlobalKey<FormState>();
  String _shippingMode = 'By Air';
  String _deliveryType = 'Door to Door';
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

  final UploadService _uploadService = UploadService();

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

  @override
  Widget build(BuildContext context) {
    // Check if keyboard is visible
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardVisible = bottomInset > 0;

    // Calculate bottom padding for content so it clears the floaty button
    final contentBottomPadding = isKeyboardVisible ? bottomInset + 100 : 100.0;

    final formState = ref.watch(shipmentFormProvider);
    final formNotifier = ref.read(shipmentFormProvider.notifier);

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

                            // 2. Delivery Type
                            _buildSectionTitle(
                              'Choose Delivery Type',
                            ).animate().fadeIn(delay: 200.ms).slideX(),
                            const SizedBox(height: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildRadioOption(
                                  'Shipment door to door',
                                  _deliveryType,
                                  (val) {
                                    setState(() => _deliveryType = val!);
                                  },
                                ),
                                const SizedBox(height: 16),
                                _buildRadioOption(
                                  'Warehouse Delivery',
                                  _deliveryType,
                                  (val) {
                                    setState(() => _deliveryType = val!);
                                  },
                                ),
                              ],
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

                            // 5. Pickup Address
                            _buildSectionTitle('Pickup Address'),
                            const SizedBox(height: 16),
                            _buildTextField(
                              hint: 'Full Name',
                              controller: _nameController,
                              validator: (value) =>
                                  value == null || value.isEmpty
                                  ? 'Name is required'
                                  : null,
                            ),
                            const SizedBox(height: 16),
                            _buildPhoneField(),
                            const SizedBox(height: 16),
                            _buildTextField(
                              hint: 'Address Line 1',
                              controller: _addressController,
                              validator: (value) =>
                                  value == null || value.isEmpty
                                  ? 'Address is required'
                                  : null,
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildTextField(
                                    hint: 'City',
                                    controller: _cityController,
                                    validator: (value) =>
                                        value == null || value.isEmpty
                                        ? 'Required'
                                        : null,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildTextField(
                                    hint: 'State',
                                    controller: _stateController,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildTextField(
                                    hint: 'Country',
                                    controller: _countryController,
                                    validator: (value) =>
                                        value == null || value.isEmpty
                                        ? 'Required'
                                        : null,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildTextField(
                                    hint: 'ZIP / Postal Code',
                                    controller: _zipController,
                                    keyboardType: TextInputType.number,
                                    validator: (value) =>
                                        value == null || value.isEmpty
                                        ? 'Required'
                                        : null,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),

                            const SizedBox(height: 16),
                            _buildTextField(
                              hint:
                                  'Address Type (e.g. Home, Office, Warehouse)',
                              controller: _addressTypeController,
                              validator: (value) =>
                                  value == null || value.isEmpty
                                  ? 'Address Type is required'
                                  : null,
                            ),
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
                        'New Shipment Request',
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
              child: SizedBox(
                height: 56,
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
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
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

      final pickupAddress = {
        'name': _nameController.text,
        'phone': '$_countryCode ${_phoneController.text}',
        'addressLine': _addressController.text,
        'city': _cityController.text,
        'state': _stateController.text,
        'country': _countryController.text,
        'zip': _zipController.text,
        'addressType': _addressTypeController.text,
      };

      final destinationAddress = {
        // Using dummy destination as per current UI limitation
        'name': 'To Be Confirmed',
        'phone': '9999999999',
        'addressLine': 'To Be Confirmed',
        'city': 'To Be Confirmed',
        'state': '',
        'country': 'To Be Confirmed',
        'zip': '00000',
      };

      // Process Items including photo uploads
      List<Map<String, dynamic>> processedItems = [];

      for (final item in formState.items) {
        // Upload photos for this item
        List<String> uploadedPhotoUrls = [];

        if (item.localPhotos.isNotEmpty) {
          try {
            uploadedPhotoUrls = await _uploadService.uploadProductPhotos(
              item.localPhotos,
            );
          } catch (e) {
            // Ignore individual photo errors but maybe warn?
            print("Error uploading photos for item ${item.description}: $e");
            // Proceed without photos or stop? For now proceed.
          }
        }

        // Use description as the main identifier
        // Combine name with other details if needed for backward compatibility or display
        // But now our backend supports separated fields, so we pass them directly.

        processedItems.add({
          'description': item.description,
          'quantity': item.quantity,
          'weight': item.weight,
          'dimensions': item.dimensions, // Pass raw string
          'images': uploadedPhotoUrls, // Cloudinary URLs
          'category': item.category,
          'isHazardous': item.isHazardous,
          'hsCode': item.hsCode,
          'videoUrl': item.videoUrl,
          'targetRate': item.targetRate,
          'packingVolume': item.packingVolume,

          // Fallback/Legacy fields
          'unitPrice': 0,
          'amount': 0,
        });
      }

      final requestData = {
        'origin': pickupAddress,
        'destination': destinationAddress,
        'items': processedItems,
        'cargoType':
            'General Cargo', // Consider making this dynamic if all items are same? Or just default
        'serviceType': _servicePriority, // Use global priority
        'specialInstructions':
            'Mode: $_shippingMode, Delivery: $_deliveryType\nNotes: ${_notesController.text}',
        'pickupDate': DateTime.now()
            .add(const Duration(days: 1))
            .toIso8601String(), // Default to tomorrow
        'productPhotos':
            [], // Legacy top-level photos - empty now as items have them
      };

      await ref.read(quotationRepositoryProvider).createQuotation(requestData);

      // Invalidate providers to force refresh
      ref.invalidate(quotationsProvider);
      ref.invalidate(dashboardStatsProvider);

      // Dismiss loading
      if (mounted) Navigator.of(context).pop();

      _showSuccessDialog();
    } catch (e) {
      // Dismiss loading
      if (mounted) Navigator.of(context).pop();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create request: $e'),
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

  Widget _buildPhoneField() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          PopupMenuButton<String>(
            onSelected: (value) => setState(() => _countryCode = value),
            color: Colors.white,
            surfaceTintColor: Colors.white,
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: '+1',
                child: Row(
                  children: [
                    Text('🇺🇸', style: TextStyle(fontSize: 20)),
                    SizedBox(width: 8),
                    Text('+1'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: '+91',
                child: Row(
                  children: [
                    Text('🇮🇳', style: TextStyle(fontSize: 20)),
                    SizedBox(width: 8),
                    Text('+91'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: '+971',
                child: Row(
                  children: [
                    Text('🇦🇪', style: TextStyle(fontSize: 20)),
                    SizedBox(width: 8),
                    Text('+971'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: '+974',
                child: Row(
                  children: [
                    Text('🇶🇦', style: TextStyle(fontSize: 20)),
                    SizedBox(width: 8),
                    Text('+974'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: '+973',
                child: Row(
                  children: [
                    Text('🇧🇭', style: TextStyle(fontSize: 20)),
                    SizedBox(width: 8),
                    Text('+973'),
                  ],
                ),
              ),
            ],
            child: Row(
              children: [
                Text(
                  _countryCode == '+1'
                      ? '🇺🇸'
                      : _countryCode == '+91'
                      ? '🇮🇳'
                      : _countryCode == '+971'
                      ? '🇦🇪'
                      : _countryCode == '+974'
                      ? '🇶🇦'
                      : '🇧🇭',
                  style: const TextStyle(fontSize: 24),
                ),
                const Icon(Icons.arrow_drop_down, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  _countryCode,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(width: 1, height: 24, color: Colors.grey[300]),
          const SizedBox(width: 12),
          Expanded(
            child: TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.black87),
              decoration: InputDecoration(
                hintText: 'Phone Number',
                hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[400],
                  fontSize: 13,
                ),
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
                isDense: true,
                filled: false,
              ),
              validator: (value) =>
                  value == null || value.isEmpty ? 'Required' : null,
            ),
          ),
        ],
      ),
    );
  }
}
