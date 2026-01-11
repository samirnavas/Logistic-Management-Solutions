import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RequestShipmentScreen extends StatefulWidget {
  const RequestShipmentScreen({super.key});

  @override
  State<RequestShipmentScreen> createState() => _RequestShipmentScreenState();
}

class _RequestShipmentScreenState extends State<RequestShipmentScreen> {
  String _shippingMode = 'By Air';
  String _deliveryType = 'Door to Door';

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
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'New Shipment Request',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Shipping Mode
            _buildSectionTitle('Shipping Mode'),
            Row(
              children: [
                _buildRadioOption('By Air', _shippingMode, (val) {
                  setState(() => _shippingMode = val!);
                }),
                const SizedBox(width: 16),
                _buildRadioOption('By Sea', _shippingMode, (val) {
                  setState(() => _shippingMode = val!);
                }),
              ],
            ),
            const SizedBox(height: 24),

            // 2. Delivery Type
            _buildSectionTitle('Delivery Type'),
            Row(
              children: [
                _buildRadioOption('Door to Door', _deliveryType, (val) {
                  setState(() => _deliveryType = val!);
                }),
                const SizedBox(width: 16),
                _buildRadioOption('Warehouse Delivery', _deliveryType, (val) {
                  setState(() => _deliveryType = val!);
                }),
              ],
            ),
            const SizedBox(height: 24),

            // 3. Package Details
            _buildSectionTitle('Package Details'),
            const SizedBox(height: 12),
            _buildTextField(
              label: 'Item Name',
              controller: _itemNameController,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    label: 'No. of Boxes',
                    controller: _boxesController,
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildTextField(
                    label: 'Total CBM',
                    controller: _cbmController,
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildTextField(
              label: 'HS Code (Optional)',
              controller: _hsCodeController,
            ),
            const SizedBox(height: 24),

            // 4. Product Photos
            _buildSectionTitle('Product Photos'),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildPhotoPlaceholder(),
                const SizedBox(width: 12),
                _buildPhotoPlaceholder(),
                const SizedBox(width: 12),
                _buildPhotoPlaceholder(),
              ],
            ),
            const SizedBox(height: 24),

            // 5. Pickup Address
            _buildSectionTitle('Pickup Address'),
            const SizedBox(height: 12),
            _buildTextField(label: 'Full Name', controller: _nameController),
            const SizedBox(height: 12),
            _buildTextField(
              label: 'Phone Number',
              controller: _phoneController,
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 12),
            _buildTextField(
              label: 'Address Line',
              controller: _addressController,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    label: 'City',
                    controller: _cityController,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildTextField(
                    label: 'State',
                    controller: _stateController,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    label: 'Country',
                    controller: _countryController,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildTextField(
                    label: 'ZIP Code',
                    controller: _zipController,
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // 6. Notes
            _buildSectionTitle('Notes'),
            const SizedBox(height: 12),
            _buildTextField(
              label: 'Additional Instructions...',
              controller: _notesController,
              maxLines: 4,
            ),
            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  // Submission logic to be implemented
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Request submitted!')),
                  );
                  Navigator.of(context).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'Request Pickup',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: Colors.black87,
      ),
    );
  }

  Widget _buildRadioOption(
    String value,
    String groupValue,
    ValueChanged<String?> onChanged,
  ) {
    return Row(
      children: [
        // ignore: deprecated_member_use
        Radio<String>(
          value: value,
          groupValue: groupValue,
          onChanged: onChanged,
          activeColor: AppTheme.primaryColor,
        ),
        Text(value, style: GoogleFonts.poppins(fontSize: 14)),
      ],
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: GoogleFonts.poppins(fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 13),
        alignLabelWithHint: maxLines > 1,
        fillColor: Colors.grey[50],
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppTheme.primaryColor),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
    );
  }

  Widget _buildPhotoPlaceholder() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.grey.shade300,
          width: 1,
          style: BorderStyle.solid,
        ),
      ),
      child: Center(
        child: Icon(Icons.add_a_photo_outlined, color: Colors.grey[400]),
      ),
    );
  }
}
