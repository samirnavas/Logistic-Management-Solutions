import 'dart:io';

import 'package:bb_logistics/src/core/api/upload_service.dart';
import 'package:bb_logistics/src/core/widgets/app_drawer.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';

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
  String _countryCode = '+91'; // Default India

  // Controllers
  final _itemNameController = TextEditingController();
  final _boxesController = TextEditingController();
  final _cbmController = TextEditingController();
  final _hsCodeController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _countryController = TextEditingController();
  final _zipController = TextEditingController();
  final _notesController = TextEditingController();

  // Photo state
  final List<File> _selectedPhotos = [];
  final ImagePicker _picker = ImagePicker();
  final UploadService _uploadService = UploadService();

  @override
  void dispose() {
    _itemNameController.dispose();
    _boxesController.dispose();
    _cbmController.dispose();
    _hsCodeController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _countryController.dispose();
    _zipController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Check if keyboard is visible
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardVisible = bottomInset > 0;

    // Calculate bottom padding for content so it clears the floaty button
    final contentBottomPadding = isKeyboardVisible ? bottomInset + 100 : 100.0;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: BlueBackgroundScaffold(
        drawer: const AppDrawer(),
        body: Stack(
          children: [
            // 1. Scrollable Content (Moved First)
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

                            // 3. Package Details
                            _buildSectionTitle(
                              'Package Details',
                            ).animate().fadeIn(delay: 300.ms).slideX(),
                            const SizedBox(height: 16),
                            _buildTextField(
                              hint: 'Item Name',
                              controller: _itemNameController,
                              validator: (value) =>
                                  value == null || value.isEmpty
                                  ? 'Item name is required'
                                  : null,
                            ).animate().fadeIn(delay: 350.ms),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildTextField(
                                    hint: 'Number of Boxes',
                                    controller: _boxesController,
                                    keyboardType: TextInputType.number,
                                    validator: (value) =>
                                        value == null || value.isEmpty
                                        ? 'Required'
                                        : null,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildTextField(
                                    hint: 'Total CBM',
                                    controller: _cbmController,
                                    keyboardType: TextInputType.number,
                                    validator: (value) =>
                                        value == null || value.isEmpty
                                        ? 'Required'
                                        : null,
                                  ),
                                ),
                              ],
                            ).animate().fadeIn(delay: 400.ms),
                            const SizedBox(height: 16),
                            _buildTextField(
                              hint: 'HS Code',
                              controller: _hsCodeController,
                            ).animate().fadeIn(delay: 450.ms),
                            const SizedBox(height: 24),

                            // 4. Product Photos
                            _buildSectionTitle('Product Photos'),
                            const SizedBox(height: 8),
                            Text(
                              'Add up to 5 photos of your products',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: Colors.grey[600]),
                            ),
                            const SizedBox(height: 12),
                            _buildPhotoSection(),
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

            // 2. Custom App Bar Content (Back Button & Title) (Moved Second)
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

      // Construct item description from form details
      final itemDescription =
          '${_itemNameController.text} - ${_boxesController.text} Boxes, ${_cbmController.text} CBM, HS: ${_hsCodeController.text}';

      // Upload photos first if any
      List<String> uploadedPhotoUrls = [];
      if (_selectedPhotos.isNotEmpty) {
        try {
          uploadedPhotoUrls = await _uploadService.uploadProductPhotos(
            _selectedPhotos,
          );
        } catch (e) {
          if (mounted) Navigator.of(context).pop();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Failed to upload photos: ${e.toString().replaceAll('Exception:', '').trim()}',
                ),
                backgroundColor: Colors.red,
              ),
            );
          }
          return;
        }
      }

      final requestData = {
        'origin': pickupAddress,
        'destination': destinationAddress,
        'items': [
          {
            'description': itemDescription,
            'quantity': int.tryParse(_boxesController.text) ?? 1,
            'unitPrice': 0,
            'amount': 0,
          },
        ],
        'cargoType': 'General Cargo', // Default
        'serviceType': 'Standard', // Default
        'specialInstructions':
            'Mode: $_shippingMode, Delivery: $_deliveryType\nNotes: ${_notesController.text}',
        'pickupDate': DateTime.now()
            .add(const Duration(days: 1))
            .toIso8601String(), // Default to tomorrow
        'productPhotos': uploadedPhotoUrls,
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
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
            ],
            child: Row(
              children: [
                Text(
                  _countryCode == '+1' ? '🇺🇸' : '🇮🇳',
                  style: const TextStyle(fontSize: 20),
                ),
                const SizedBox(width: 4),
                Text(
                  _countryCode,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const Icon(
                  Icons.keyboard_arrow_down,
                  color: Colors.grey,
                  size: 18,
                ),
              ],
            ),
          ),
          Container(
            height: 24,
            width: 1,
            margin: const EdgeInsets.symmetric(horizontal: 12),
            color: Colors.grey.shade300,
          ),
          Expanded(
            child: TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              validator: (value) =>
                  value == null || value.isEmpty ? 'Required' : null,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.black87),
              decoration: InputDecoration(
                border: InputBorder.none,
                filled: false,
                fillColor: Colors.transparent,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                errorBorder: InputBorder.none,
                focusedErrorBorder: InputBorder.none,
                hintText: 'Phone Number',
                hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[400],
                  fontSize: 13,
                ),
                contentPadding: EdgeInsets.zero,
                isDense: true,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoSection() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          // Existing photos
          ..._selectedPhotos.asMap().entries.map((entry) {
            final index = entry.key;
            final file = entry.value;
            return Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Stack(
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      image: DecorationImage(
                        image: FileImage(file),
                        fit: BoxFit.cover,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                  // Remove button
                  Positioned(
                    top: -4,
                    right: -4,
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        setState(() {
                          _selectedPhotos.removeAt(index);
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close,
                          size: 14,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
          // Add photo button (if less than 5)
          if (_selectedPhotos.length < 5)
            GestureDetector(
              onTap: _showPhotoSourceDialog,
              child: Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.3),
                    width: 2,
                    strokeAlign: BorderSide.strokeAlignInside,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.add_photo_alternate_outlined,
                      color: AppTheme.primaryBlue,
                      size: 28,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_selectedPhotos.length}/5',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.primaryBlue,
                        fontWeight: FontWeight.w500,
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

  void _showPhotoSourceDialog() {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Add Product Photo',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.camera_alt,
                    color: AppTheme.primaryBlue,
                  ),
                ),
                title: const Text('Take Photo'),
                subtitle: const Text('Use your camera'),
                onTap: () {
                  Navigator.pop(context);
                  _pickPhoto(ImageSource.camera);
                },
              ),
              const SizedBox(height: 8),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.photo_library,
                    color: AppTheme.primaryBlue,
                  ),
                ),
                title: const Text('Choose from Gallery'),
                subtitle: const Text('Select existing photos'),
                onTap: () {
                  Navigator.pop(context);
                  _pickPhoto(ImageSource.gallery);
                },
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickPhoto(ImageSource source) async {
    try {
      if (source == ImageSource.gallery) {
        // For gallery, allow multiple selection
        final List<XFile> pickedFiles = await _picker.pickMultiImage(
          maxWidth: 1200,
          maxHeight: 1200,
          imageQuality: 85,
        );

        if (pickedFiles.isNotEmpty) {
          final remainingSlots = 5 - _selectedPhotos.length;
          final filesToAdd = pickedFiles.take(remainingSlots).toList();

          setState(() {
            _selectedPhotos.addAll(filesToAdd.map((xFile) => File(xFile.path)));
          });

          if (pickedFiles.length > remainingSlots) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Only added $remainingSlots photos (max 5 total)',
                  ),
                  backgroundColor: AppTheme.warning,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          }
        }
      } else {
        // For camera, pick single image
        final XFile? pickedFile = await _picker.pickImage(
          source: source,
          maxWidth: 1200,
          maxHeight: 1200,
          imageQuality: 85,
        );

        if (pickedFile != null) {
          setState(() {
            _selectedPhotos.add(File(pickedFile.path));
          });
        }
      }
      HapticFeedback.lightImpact();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick image: ${e.toString()}'),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}
