import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/quotation/data/quotation_repository.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class AddAddressScreen extends ConsumerStatefulWidget {
  final String quotationId;
  final bool isPickup;
  final bool fromShipmentFlow;

  const AddAddressScreen({
    super.key,
    required this.quotationId,
    this.isPickup = true,
    this.fromShipmentFlow = false,
  });

  @override
  ConsumerState<AddAddressScreen> createState() => _AddAddressScreenState();
}

class _AddAddressScreenState extends ConsumerState<AddAddressScreen> {
  final _formKey = GlobalKey<FormState>();
  String _handoverMethod = 'PICKUP';

  // Origin Controllers
  final _originNameController = TextEditingController();
  final _originPhoneController = TextEditingController();
  final _originAddressController = TextEditingController();
  final _originCityController = TextEditingController();
  final _originStateController = TextEditingController();
  final _originZipController = TextEditingController();
  final _originCountryController = TextEditingController(text: 'India');

  // Destination Controllers
  final _destNameController = TextEditingController();
  final _destPhoneController = TextEditingController();
  final _destAddressController = TextEditingController();
  final _destCityController = TextEditingController();
  final _destStateController = TextEditingController();
  final _destZipController = TextEditingController();
  final _destCountryController = TextEditingController(text: 'India');

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Initialize handover method based on isPickup
    if (!widget.isPickup) {
      _handoverMethod =
          'PICKUP'; // Delivery is usually to Door (Pickup from perspective of last mile?)
      // Actually delivery doesn't have handover method logic in this form usually?
      // But if we are adding DELIVERY address, handoverMethod toggle (Pickup/Dropoff) might be irrelevant?
      // If it's delivery, we just show delivery address fields.
    }

    // Smart Auto-fill for Pickup (Sender)
    if (widget.isPickup && widget.fromShipmentFlow) {
      final authState = ref.read(authRepositoryProvider);
      final user = authState.value;
      if (user != null) {
        _originNameController.text = user.fullName;
        _originPhoneController.text = user.phone;
      }
    }
  }

  @override
  void dispose() {
    _originNameController.dispose();
    _originPhoneController.dispose();
    _originAddressController.dispose();
    _originCityController.dispose();
    _originStateController.dispose();
    _originZipController.dispose();
    _originCountryController.dispose();
    _destNameController.dispose();
    _destPhoneController.dispose();
    _destAddressController.dispose();
    _destCityController.dispose();
    _destStateController.dispose();
    _destZipController.dispose();
    _destCountryController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final Map<String, dynamic> resultData = {};

      if (widget.isPickup) {
        // Collect Origin Data
        // If handover is Drop-off, different logic?
        if (_handoverMethod == 'DROP_OFF') {
          resultData['handoverMethod'] = 'DROP_OFF';
          resultData['pickupAddress'] = 'Self Drop-off';
          // For consistency in return
          resultData['origin'] = {
            'name': 'Self Drop-off',
            'phone': 'N/A',
            'addressLine': 'Self Drop-off to Warehouse',
            'city': 'Warehouse City',
            'state': 'N/A',
            'zip': '00000',
            'country': 'India',
          };
        } else {
          resultData['handoverMethod'] = 'PICKUP';
          resultData['pickupAddress'] = _originAddressController.text;
          resultData['origin'] = {
            'name': _originNameController.text,
            'phone': _originPhoneController.text,
            'addressLine': _originAddressController.text,
            'city': _originCityController.text,
            'state': _originStateController.text,
            'zip': _originZipController.text,
            'country': _originCountryController.text,
          };
        }
      } else {
        // Collect Destination Data
        resultData['destination'] = {
          'name': _destNameController.text,
          'phone': _destPhoneController.text,
          'addressLine': _destAddressController.text,
          'city': _destCityController.text,
          'state': _destStateController.text,
          'zip': _destZipController.text,
          'country': _destCountryController.text,
        };
      }

      if (widget.fromShipmentFlow) {
        // Return result without saving
        if (mounted) context.pop(resultData);
        return;
      }

      // Existing Logic for Quotation Update (renamed updateData to resultData for reuse if possible but structure matches)
      // Note: The existing logic built a specific structure. The above structure matches 'origin' and 'destination' keys.

      // If NOT from shipment flow (e.g. editing quotation), we might need both or specific structure?
      // The original code gathered both.
      // If we are in "single mode" (isPickup or !isPickup), we might only be updating one part?
      // But updateQuotation merges?
      // Let's assume for Quotation Flow we still want existing behavior?
      // BUT if we modified the UI to only show one, we can't submit the other!
      // So we should probably merge with existing quotation data if we were editing?
      // But we don't have existing quotation data here easily unless we fetch it.
      // However, typical "Add Address" flow usually adds one?
      // Let's stick to returning data for fromShipmentFlow.

      // For legacy/existing flow (Quotations), we keep the original logic if we haven't broken it.
      // But we just changed resultData construction.
      // Let's restore original logic for non-shipment flow if needed, OR use the new selective logic.
      // If the user navigates here from Quotation, do they want to add BOTH?
      // The original UI showed BOTH.
      // If we change UI to show only one, we must support one-sided update.
      // Assuming backend supports partial update.

      // Re-constructing full update payload for Quotation (legacy flow)
      final Map<String, dynamic> updateData = {};
      if (widget.isPickup) {
        updateData['origin'] = resultData['origin'];
        updateData['handoverMethod'] = resultData.containsKey('handoverMethod')
            ? resultData['handoverMethod']
            : 'PICKUP';
        if (resultData.containsKey('pickupAddress')) {
          updateData['pickupAddress'] = resultData['pickupAddress'];
        }
      } else {
        updateData['destination'] = resultData['destination'];
      }

      // Explicitly Remove Status: Ensure we NEVER send status from UI in this step.
      updateData.remove('status');

      // Debug Log: Print the payload to the console
      debugPrint('Submitting Address Payload: $updateData');

      // Use general updateQuotation instead of updateAddress
      // Backend will handle status transition (VERIFIED -> ADDRESS_PROVIDED)
      await ref
          .read(quotationRepositoryProvider)
          .updateQuotation(widget.quotationId, updateData);

      if (mounted) {
        // Refresh the provider to update the list
        ref.invalidate(quotationsProvider);

        // Navigate to home/shipment list screen
        context.go('/');

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Address details submitted successfully!'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.primaryBlue, size: 20),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryBlue,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool required = true,
    bool enabled = true,
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        enabled: enabled,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, color: Colors.grey[400], size: 18),
          filled: !enabled,
          fillColor: !enabled ? Colors.grey[100] : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey[200]!),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey[200]!),
          ),
        ),
        validator: required
            ? (value) {
                if (!enabled) return null;
                if (value == null || value.trim().isEmpty) {
                  return '$label is required';
                }
                return null;
              }
            : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlueBackgroundScaffold(
      appBar: AppBar(
        title: Text(
          widget.isPickup ? 'Add Pickup Location' : 'Add Delivery Location',
        ),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      if (widget.isPickup && !widget.fromShipmentFlow) ...[
                        Padding(
                          padding: const EdgeInsets.only(bottom: 20, top: 10),
                          child: Text(
                            'Select your prefered handover method.',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(color: Colors.grey[600]),
                            textAlign: TextAlign.center,
                          ),
                        ),

                        // Handover Method Toggle - Custom styled SegmentedButton replacement
                        // Using a simpler Row with InkWell for better control if SegmentedButton causes issues,
                        // or sticking to standard widgets. Let's use SegmentedButton properly.
                        SegmentedButton<String>(
                          segments: const <ButtonSegment<String>>[
                            ButtonSegment<String>(
                              value: 'PICKUP',
                              label: Text('Request Pickup'),
                              icon: Icon(Icons.local_shipping_outlined),
                            ),
                            ButtonSegment<String>(
                              value: 'DROP_OFF', // Backend enum is DROP_OFF
                              label: Text('Self Drop-off'),
                              icon: Icon(Icons.warehouse_outlined),
                            ),
                          ],
                          selected: <String>{_handoverMethod},
                          onSelectionChanged: (Set<String> newSelection) {
                            setState(() {
                              _handoverMethod = newSelection.first;
                            });
                          },
                          style: ButtonStyle(
                            backgroundColor:
                                WidgetStateProperty.resolveWith<Color?>((
                                  Set<WidgetState> states,
                                ) {
                                  if (states.contains(WidgetState.selected)) {
                                    return AppTheme.primaryBlue.withValues(
                                      alpha: 0.1,
                                    );
                                  }
                                  return null;
                                }),
                            foregroundColor:
                                WidgetStateProperty.resolveWith<Color?>((
                                  Set<WidgetState> states,
                                ) {
                                  if (states.contains(WidgetState.selected)) {
                                    return AppTheme.primaryBlue;
                                  }
                                  return Colors.grey[700];
                                }),
                          ),
                        ),
                      ],

                      const SizedBox(height: 24),

                      // Origin Section
                      if (widget.isPickup)
                        Opacity(
                          opacity: _handoverMethod == 'PICKUP' ? 1.0 : 0.6,
                          child: IgnorePointer(
                            ignoring: _handoverMethod != 'PICKUP',
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildSectionHeader(
                                  'Pickup Address',
                                  Icons.location_on,
                                ),
                                _buildTextField(
                                  controller: _originNameController,
                                  label: 'Sender Name',
                                  icon: Icons.person,
                                  enabled: _handoverMethod == 'PICKUP',
                                ),
                                _buildTextField(
                                  controller: _originPhoneController,
                                  label: 'Sender Phone',
                                  icon: Icons.phone,
                                  keyboardType: TextInputType.phone,
                                  enabled: _handoverMethod == 'PICKUP',
                                ),
                                _buildTextField(
                                  controller: _originAddressController,
                                  label: 'Address Line',
                                  icon: Icons.home,
                                  enabled: _handoverMethod == 'PICKUP',
                                ),
                                Row(
                                  children: [
                                    Expanded(
                                      child: _buildTextField(
                                        controller: _originCityController,
                                        label: 'City',
                                        icon: Icons.location_city,
                                        enabled: _handoverMethod == 'PICKUP',
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: _buildTextField(
                                        controller: _originZipController,
                                        label: 'ZIP Code',
                                        icon: Icons.pin,
                                        keyboardType: TextInputType.number,
                                        enabled: _handoverMethod == 'PICKUP',
                                      ),
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    Expanded(
                                      child: _buildTextField(
                                        controller: _originStateController,
                                        label: 'State',
                                        icon: Icons.map,
                                        required: false,
                                        enabled: _handoverMethod == 'PICKUP',
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: _buildTextField(
                                        controller: _originCountryController,
                                        label: 'Country',
                                        icon: Icons.flag,
                                        enabled: _handoverMethod == 'PICKUP',
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),

                      if (widget.isPickup && _handoverMethod == 'DROP_OFF')
                        Container(
                          margin: const EdgeInsets.symmetric(vertical: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.blue.shade100),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.info_outline,
                                color: Colors.blue.shade700,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'You will receive the warehouse drop-off location and instructions after submitting.',
                                  style: TextStyle(
                                    color: Colors.blue.shade900,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      const Divider(height: 40),

                      // Destination Section
                      if (!widget.isPickup) ...[
                        _buildSectionHeader(
                          'Delivery Address',
                          Icons.local_shipping,
                        ),
                        _buildTextField(
                          controller: _destNameController,
                          label: 'Receiver Name',
                          icon: Icons.person,
                        ),
                        _buildTextField(
                          controller: _destPhoneController,
                          label: 'Receiver Phone',
                          icon: Icons.phone,
                          keyboardType: TextInputType.phone,
                        ),
                        _buildTextField(
                          controller: _destAddressController,
                          label: 'Address Line',
                          icon: Icons.home,
                        ),
                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _destCityController,
                                label: 'City',
                                icon: Icons.location_city,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _buildTextField(
                                controller: _destZipController,
                                label: 'ZIP Code',
                                icon: Icons.pin,
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _destStateController,
                                label: 'State',
                                icon: Icons.map,
                                required: false,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _buildTextField(
                                controller: _destCountryController,
                                label: 'Country',
                                icon: Icons.flag,
                              ),
                            ),
                          ],
                        ),
                      ],

                      const SizedBox(height: 30),

                      // Submit Button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryBlue,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'Submit Address Details',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
