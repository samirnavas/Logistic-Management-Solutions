import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/address/data/address_repository.dart';
import 'package:bb_logistics/src/features/address/domain/address.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class SavedAddressesScreen extends ConsumerWidget {
  const SavedAddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addressesAsync = ref.watch(addressRepositoryProvider);

    return BlueBackgroundScaffold(
      body: Stack(
        children: [
          // 1. Content
          Positioned.fill(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  SizedBox(height: MediaQuery.of(context).padding.top + 70),
                  Container(
                    width: double.infinity,
                    constraints: BoxConstraints(
                      minHeight: MediaQuery.of(context).size.height - 100,
                    ),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(30),
                        topRight: Radius.circular(30),
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 30,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Saved Addresses',
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                        ).animate().fadeIn(duration: 500.ms).slideX(),

                        const SizedBox(height: 24),

                        addressesAsync.when(
                          data: (addresses) {
                            if (addresses.isEmpty) {
                              return Center(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 40,
                                  ),
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.location_off_outlined,
                                        size: 60,
                                        color: Colors.grey[300],
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        'No saved addresses found',
                                        style: TextStyle(
                                          color: Colors.grey[500],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }
                            return ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: addresses.length,
                              separatorBuilder: (context, index) =>
                                  const SizedBox(height: 16),
                              itemBuilder: (context, index) {
                                final address = addresses[index];
                                return _AddressCard(address: address)
                                    .animate()
                                    .fadeIn(delay: (100 * index).ms)
                                    .slideX();
                              },
                            );
                          },
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(40.0),
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          error: (error, stack) => Center(
                            child: Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Text('Error: $error'),
                            ),
                          ),
                        ),

                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 2. Custom App Bar
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
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => context.pop(),
                    ),
                    const SizedBox(), // Spacer
                  ],
                ),
              ),
            ),
          ),

          // 3. FAB
          Positioned(
            bottom: 30,
            right: 20,
            child: FloatingActionButton.extended(
              onPressed: () {
                HapticFeedback.mediumImpact();
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(20),
                    ),
                  ),
                  builder: (context) => const _AddAddressSheet(),
                );
              },
              backgroundColor: AppTheme.primaryBlue,
              icon: const Icon(
                Icons.add_location_alt_outlined,
                color: Colors.white,
              ),
              label: const Text(
                'Add New Address',
                style: TextStyle(color: Colors.white),
              ),
            ).animate().scale(delay: 500.ms),
          ),
        ],
      ),
    );
  }
}

class _AddressCard extends ConsumerWidget {
  final Address address;

  const _AddressCard({required this.address});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primaryBlue.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.location_on,
              color: AppTheme.primaryBlue,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      address.label,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (address.isDefault) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'DEFAULT',
                          style: TextStyle(
                            color: AppTheme.success,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  address.addressLine,
                  style: TextStyle(color: Colors.grey[700]),
                ),
                Text(
                  '${address.city}, ${address.country}',
                  style: TextStyle(color: Colors.grey[500], fontSize: 13),
                ),
              ],
            ),
          ),
          // Edit Button
          IconButton(
            icon: Icon(Icons.edit_outlined, color: Colors.grey[600]),
            onPressed: () {
              HapticFeedback.lightImpact();
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                builder: (context) => _EditAddressSheet(address: address),
              );
            },
          ),
          // Delete Button
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.red),
            onPressed: () {
              HapticFeedback.lightImpact();
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Delete Address'),
                  content: const Text(
                    'Are you sure you want to delete this address?',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () async {
                        Navigator.pop(context);
                        try {
                          await ref
                              .read(addressRepositoryProvider.notifier)
                              .deleteAddress(address.id);
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Failed to delete: $e'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        }
                      },
                      style: TextButton.styleFrom(foregroundColor: Colors.red),
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _AddAddressSheet extends ConsumerStatefulWidget {
  const _AddAddressSheet();

  @override
  ConsumerState<_AddAddressSheet> createState() => _AddAddressSheetState();
}

class _AddAddressSheetState extends ConsumerState<_AddAddressSheet> {
  final _formKey = GlobalKey<FormState>();
  final _labelController = TextEditingController(text: 'Home');
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _countryController = TextEditingController();
  final _zipController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _labelController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _countryController.dispose();
    _zipController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Add New Address',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Label Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['Home', 'Office', 'Warehouse', 'Other'].map((label) {
                  final isSelected = _labelController.text == label;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(label),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) {
                          HapticFeedback.lightImpact();
                          setState(() => _labelController.text = label);
                        }
                      },
                      selectedColor: AppTheme.primaryBlue.withValues(
                        alpha: 0.1,
                      ),
                      labelStyle: TextStyle(
                        color: isSelected
                            ? AppTheme.primaryBlue
                            : Colors.grey[600],
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                      side: BorderSide(
                        color: isSelected
                            ? AppTheme.primaryBlue
                            : Colors.grey[300]!,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(
                labelText: 'Address Line',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _cityController,
                    decoration: const InputDecoration(
                      labelText: 'City',
                      prefixIcon: Icon(Icons.location_city),
                    ),
                    validator: (value) => value!.isEmpty ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _zipController,
                    decoration: const InputDecoration(
                      labelText: 'Zip Code',
                      prefixIcon: Icon(Icons.numbers),
                    ),
                    validator: (value) => value!.isEmpty ? 'Required' : null,
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _countryController,
              decoration: const InputDecoration(
                labelText: 'Country',
                prefixIcon: Icon(Icons.public),
              ),
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),

            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('Save Address'),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);

    try {
      final newAddress = Address(
        id: '', // Server will assign
        label: _labelController.text,
        addressLine: _addressController.text,
        city: _cityController.text,
        state: '',
        country: _countryController.text,
        zipCode: _zipController.text,
      );

      await ref.read(addressRepositoryProvider.notifier).addAddress(newAddress);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Address added successfully'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add address: ${e.toString()}'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}

// ============================================
// Edit Address Sheet
// ============================================
class _EditAddressSheet extends ConsumerStatefulWidget {
  final Address address;

  const _EditAddressSheet({required this.address});

  @override
  ConsumerState<_EditAddressSheet> createState() => _EditAddressSheetState();
}

class _EditAddressSheetState extends ConsumerState<_EditAddressSheet> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _labelController;
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  late TextEditingController _countryController;
  late TextEditingController _zipController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController(text: widget.address.label);
    _addressController = TextEditingController(
      text: widget.address.addressLine,
    );
    _cityController = TextEditingController(text: widget.address.city);
    _countryController = TextEditingController(text: widget.address.country);
    _zipController = TextEditingController(text: widget.address.zipCode);
  }

  @override
  void dispose() {
    _labelController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _countryController.dispose();
    _zipController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Edit Address',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Label Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['Home', 'Office', 'Warehouse', 'Other'].map((label) {
                  final isSelected = _labelController.text == label;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(label),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) {
                          HapticFeedback.lightImpact();
                          setState(() => _labelController.text = label);
                        }
                      },
                      selectedColor: AppTheme.primaryBlue.withValues(
                        alpha: 0.1,
                      ),
                      labelStyle: TextStyle(
                        color: isSelected
                            ? AppTheme.primaryBlue
                            : Colors.grey[600],
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                      side: BorderSide(
                        color: isSelected
                            ? AppTheme.primaryBlue
                            : Colors.grey[300]!,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(
                labelText: 'Address Line',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _cityController,
                    decoration: const InputDecoration(
                      labelText: 'City',
                      prefixIcon: Icon(Icons.location_city),
                    ),
                    validator: (value) => value!.isEmpty ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _zipController,
                    decoration: const InputDecoration(
                      labelText: 'Zip Code',
                      prefixIcon: Icon(Icons.numbers),
                    ),
                    validator: (value) => value!.isEmpty ? 'Required' : null,
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _countryController,
              decoration: const InputDecoration(
                labelText: 'Country',
                prefixIcon: Icon(Icons.public),
              ),
              validator: (value) => value!.isEmpty ? 'Required' : null,
            ),

            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('Update Address'),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);

    try {
      final updatedAddress = Address(
        id: widget.address.id,
        label: _labelController.text,
        addressLine: _addressController.text,
        city: _cityController.text,
        state: widget.address.state,
        country: _countryController.text,
        zipCode: _zipController.text,
        isDefault: widget.address.isDefault,
        contactName: widget.address.contactName,
        contactPhone: widget.address.contactPhone,
      );

      await ref
          .read(addressRepositoryProvider.notifier)
          .updateAddress(updatedAddress);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Address updated successfully'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update address: ${e.toString()}'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
