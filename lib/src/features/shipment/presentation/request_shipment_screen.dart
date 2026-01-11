import 'dart:ui';
import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class RequestShipmentScreen extends StatefulWidget {
  const RequestShipmentScreen({super.key});

  @override
  State<RequestShipmentScreen> createState() => _RequestShipmentScreenState();
}

class _RequestShipmentScreenState extends State<RequestShipmentScreen> {
  final _formKey = GlobalKey<FormState>();
  String _shippingMode = 'By Air';
  String _deliveryType = 'Door to Door';
  String _countryCode = '+1'; // Default USA

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
      child: Scaffold(
        backgroundColor: Colors.white,
        resizeToAvoidBottomInset:
            false, // We use manual padding for smoother animation
        body: Stack(
          children: [
            // 1. Blue Header Background (Fixed)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 280,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0xFF4FC3F7), // Light Blue
                      Color(0xFF0288D1), // Darker Blue
                    ],
                  ),
                ),
              ),
            ),

            // 2. Custom App Bar Content (Back Button & Title)
            // Situated below the scrollable content in stack order to match Home Screen behavior
            // (or place it above if we want it clickable over the white card, but Home screen puts scrollable on top)
            // However, for a form screen, staying accessible is better.
            // Matching Home Screen structure: Scrollable is LAST, covering the header.
            // We will stick to the Home Screen pattern primarily, but careful with usability.
            // Home Screen: Lines 37-75 (AppBar) is BEFORE Lines 78-319 (Scrollable).
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
                        onPressed: () => Navigator.of(context).pop(),
                      ), // Back Button
                      const SizedBox(width: 8),
                      Text(
                        'New Shipment Request',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          fontSize: 20,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // 3. Scrollable Content (White Card scrolls UP over the blue header)
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
                        color: Colors.white,
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(30),
                          topRight: Radius.circular(30),
                        ),
                      ),
                      padding: EdgeInsets.fromLTRB(
                        24,
                        30,
                        24,
                        contentBottomPadding,
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 1. Shipping Mode
                            _buildSectionTitle('Choose Shipping Mode'),
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
                            ),
                            const SizedBox(height: 24),

                            // 2. Delivery Type
                            _buildSectionTitle('Choose Delivery Type'),
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
                            ),
                            const SizedBox(height: 24),

                            // 3. Package Details
                            _buildSectionTitle('Package Details'),
                            const SizedBox(height: 16),
                            _buildTextField(
                              hint: 'Item Name',
                              controller: _itemNameController,
                              validator: (value) =>
                                  value == null || value.isEmpty
                                  ? 'Item name is required'
                                  : null,
                            ),
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
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              hint: 'HS Code',
                              controller: _hsCodeController,
                            ),
                            const SizedBox(height: 24),

                            // 4. Product Photos
                            _buildSectionTitle('Product Photos'),
                            const SizedBox(height: 16),
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  _buildPhotoPlaceholder(),
                                  const SizedBox(width: 16),
                                  _buildPhotoPlaceholder(),
                                  const SizedBox(width: 16),
                                  _buildPhotoPlaceholder(),
                                ],
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

            // Floating Button
            AnimatedPositioned(
              duration: const Duration(milliseconds: 100),
              curve: Curves.easeOut,
              left: 24, // Add horizontal padding
              right: 24, // Add horizontal padding
              // Float 24px above bottom, or 24px above keyboard
              bottom: isKeyboardVisible ? bottomInset + 12 : 32,
              child: SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      _showSuccessDialog();
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Please fill in all required fields.'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0056A2),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    elevation: 5, // Add elevation for floating effect
                    shadowColor: Colors.black.withValues(alpha: 0.3),
                  ),
                  child: Text(
                    'REQUEST PICKUP',
                    style: GoogleFonts.poppins(
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
                'assets/request pop up png.png',
                height: 120,
                width: 120,
              ),
              const SizedBox(height: 24),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.black87,
                    height: 1.5,
                  ),
                  children: [
                    const TextSpan(text: 'Your request '),
                    TextSpan(
                      text: '#RQ1982',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF333333),
                      ),
                    ),
                    const TextSpan(
                      text:
                          ' has been submitted.\nYou will receive a quotation shortly.',
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
                    context.go('/home');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0056A2),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'GO TO DASHBOARD',
                    style: GoogleFonts.poppins(
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
      style: GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: const Color(0xFF333333),
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
              style: GoogleFonts.poppins(
                fontSize: 14,
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
      style: GoogleFonts.poppins(fontSize: 14, color: Colors.black87),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.poppins(color: Colors.grey[400], fontSize: 13),
        filled: true,
        fillColor: const Color(0xFFF5F5F5), // Very light grey
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
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(16),
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
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
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
              style: GoogleFonts.poppins(fontSize: 14, color: Colors.black87),
              decoration: InputDecoration(
                border: InputBorder.none,
                filled: false,
                fillColor: Colors.transparent,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                errorBorder: InputBorder.none,
                focusedErrorBorder: InputBorder.none,
                hintText: 'Phone Number',
                hintStyle: GoogleFonts.poppins(
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

  Widget _buildPhotoPlaceholder() {
    return Container(
      width: 90,
      height: 90,
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Center(
        child: Icon(
          Icons.file_upload_outlined,
          color: AppTheme.primaryColor,
          size: 28,
        ),
      ),
    );
  }
}
