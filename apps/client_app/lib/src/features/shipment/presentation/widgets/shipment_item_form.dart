import 'dart:io';

import 'package:bb_logistics/src/features/shipment/presentation/shipment_form_notifier.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class ShipmentItemForm extends StatefulWidget {
  final int index;
  final ShipmentItemFormData item;
  final ValueChanged<ShipmentItemFormData> onChanged;
  final VoidCallback onRemove;
  final bool isExpanded;

  const ShipmentItemForm({
    super.key,
    required this.index,
    required this.item,
    required this.onChanged,
    required this.onRemove,
    this.isExpanded = false,
  });

  @override
  State<ShipmentItemForm> createState() => _ShipmentItemFormState();
}

class _ShipmentItemFormState extends State<ShipmentItemForm> {
  final _picker = ImagePicker();
  late TextEditingController _nameController;
  late TextEditingController _quantityController;
  late TextEditingController _weightController;
  late TextEditingController _lengthController;
  late TextEditingController _widthController;
  late TextEditingController _heightController;
  late TextEditingController _targetRateController;
  late TextEditingController _videoUrlController;
  late TextEditingController _volumeController;
  late TextEditingController _hsCodeController;
  String _targetCurrency = 'USD'; // Local state for dropdown

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.item.description);

    // UX Fix: If quantity is default 1, show empty to avoid "15" on typing "5"
    _quantityController = TextEditingController(
      text: widget.item.quantity == 1 ? '' : widget.item.quantity.toString(),
    );

    // UX Fix: If weight is default 0.0, show empty
    _weightController = TextEditingController(
      text: widget.item.weight == 0.0 ? '' : widget.item.weight.toString(),
    );

    // Parse dimensions "LxWxH"
    final dims = widget.item.dimensions.toString().split('x');
    _lengthController = TextEditingController(
      text: dims.isNotEmpty ? dims[0] : '',
    );
    _widthController = TextEditingController(
      text: dims.length > 1 ? dims[1] : '',
    );
    _heightController = TextEditingController(
      text: dims.length > 2 ? dims[2] : '',
    );

    _targetRateController = TextEditingController(
      text: widget.item.targetRate?.toString() ?? '',
    );
    _videoUrlController = TextEditingController(
      text: widget.item.videoUrl ?? '',
    );
    _volumeController = TextEditingController(
      text: widget.item.packingVolume?.toString() ?? '',
    );
    _hsCodeController = TextEditingController(text: widget.item.hsCode ?? '');
    _targetCurrency = widget.item.targetCurrency;
  }

  @override
  void didUpdateWidget(covariant ShipmentItemForm oldWidget) {
    super.didUpdateWidget(oldWidget);
    // In this modal usage, we avoid syncing back text controllers from widget.item
    // because widget.item updates come from our own onChanged calls, causing loop-back issues.
    // If external updates were possible (e.g. from network while editing), we'd need checks.

    // Only update non-text controllers or if there's a strong reason
    if (widget.item != oldWidget.item) {
      if (_targetCurrency != widget.item.targetCurrency) {
        _targetCurrency = widget.item.targetCurrency;
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _weightController.dispose();
    _lengthController.dispose();
    _widthController.dispose();
    _heightController.dispose();
    _targetRateController.dispose();
    _videoUrlController.dispose();
    _volumeController.dispose();
    _hsCodeController.dispose();
    super.dispose();
  }

  void _onDimensionsChanged() {
    // 1. Calculate Volume
    final l = double.tryParse(_lengthController.text) ?? 0;
    final w = double.tryParse(_widthController.text) ?? 0;
    final h = double.tryParse(_heightController.text) ?? 0;

    if (l > 0 && w > 0 && h > 0) {
      // Calculate CBM: (L*W*H) / 1,000,000 assuming cm
      final cbm = (l * w * h) / 1000000;

      // Update volume controller only if it was empty or autocalculated
      // For now, let's just update it. User can override if they want by typing in volume field directly.
      // A common pattern is to only overwrite if the user hasn't manually focused the volume field,
      // but simpler is: update if dimensions are valid.
      _volumeController.text = cbm.toStringAsFixed(3);
    }

    _updateItem();
  }

  void _updateItem() {
    final l = _lengthController.text.trim();
    final w = _widthController.text.trim();
    final h = _heightController.text.trim();
    final dimString = (l.isEmpty && w.isEmpty && h.isEmpty)
        ? ''
        : '$l'
              'x'
              '$w'
              'x'
              '$h'; // Avoid braces lint

    // Fix: Allow 0 if empty to avoid forcing '1' back into the field
    final qty = int.tryParse(_quantityController.text) ?? 0;
    final weight = double.tryParse(_weightController.text) ?? 0.0;

    final newItem = widget.item.copyWith(
      description: _nameController.text,
      quantity: qty,
      weight: weight,
      dimensions: dimString,
      targetRate: double.tryParse(_targetRateController.text),
      videoUrl: _videoUrlController.text,
      packingVolume: double.tryParse(_volumeController.text),
      hsCode: _hsCodeController.text,
      targetCurrency: _targetCurrency,
    );
    widget.onChanged(newItem);
  }

  Future<void> _pickPhotos() async {
    final List<XFile> pickedFiles = await _picker.pickMultiImage();
    if (pickedFiles.isNotEmpty) {
      final newPhotos = pickedFiles.map((e) => File(e.path)).toList();
      final updatedPhotos = [...widget.item.localPhotos, ...newPhotos];
      // Limit to 5
      if (updatedPhotos.length > 5) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Maximum 5 photos per item allowed')),
          );
        }
        return;
      }

      widget.onChanged(widget.item.copyWith(localPhotos: updatedPhotos));
    }
  }

  void _removePhoto(int photoIndex) {
    final updatedPhotos = [...widget.item.localPhotos];
    updatedPhotos.removeAt(photoIndex);
    widget.onChanged(widget.item.copyWith(localPhotos: updatedPhotos));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // 1. Basic Details
        _buildTextField(
          controller: _nameController,
          label: 'Product Name / Description',
          onChanged: (v) => _updateItem(),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                controller: _quantityController,
                label: 'Quantity (Boxes)',
                keyboardType: TextInputType.number,
                onChanged: (v) => _updateItem(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildTextField(
                controller: _weightController,
                label: 'Weight (kg)',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (v) => _updateItem(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                controller: _lengthController,
                label: 'L (cm)',
                keyboardType: TextInputType.number,
                onChanged: (v) => _onDimensionsChanged(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildTextField(
                controller: _widthController,
                label: 'W (cm)',
                keyboardType: TextInputType.number,
                onChanged: (v) => _onDimensionsChanged(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildTextField(
                controller: _heightController,
                label: 'H (cm)',
                keyboardType: TextInputType.number,
                onChanged: (v) => _onDimensionsChanged(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                controller: _volumeController,
                label: 'Volume (CBM) - Auto-calc',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (v) => _updateItem(),
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),
        // 2. Category & HS Code
        Row(
          children: [
            Expanded(
              child: InputDecorator(
                decoration: _inputDecoration('Category'),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: widget.item.category,
                    isDense: true,
                    isExpanded: true,
                    items: ['General', 'Special', 'Harmful', 'Explosive']
                        .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) {
                        widget.onChanged(widget.item.copyWith(category: val));
                      }
                    },
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildTextField(
                controller: _hsCodeController,
                label: 'HS Code (Required)',
                onChanged: (v) => _updateItem(),
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),
        // 3. Extra Details
        Row(
          children: [
            Expanded(
              flex: 2,
              child: _buildTextField(
                controller: _targetRateController,
                label: 'Target Rate',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (v) => _updateItem(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 1,
              child: InputDecorator(
                decoration: _inputDecoration('Currency'),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _targetCurrency,
                    isDense: true,
                    isExpanded: true,
                    items: ['USD', 'EUR', 'GBP', 'AED', 'INR', 'CNY']
                        .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _targetCurrency = val);
                        _updateItem();
                      }
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _buildTextField(
          controller: _videoUrlController,
          label: 'Product Video URL (Optional)',
          onChanged: (v) => _updateItem(),
        ),

        const SizedBox(height: 16),
        // 4. Photos
        const Text(
          'Product Photos',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              GestureDetector(
                onTap: _pickPhotos,
                child: Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[400]!),
                  ),
                  child: const Icon(Icons.add_a_photo, color: Colors.grey),
                ),
              ),
              const SizedBox(width: 12),
              ...widget.item.localPhotos.asMap().entries.map((entry) {
                return Stack(
                  children: [
                    Container(
                      margin: const EdgeInsets.only(right: 8),
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        image: DecorationImage(
                          image: FileImage(entry.value),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    Positioned(
                      top: 0,
                      right: 8,
                      child: GestureDetector(
                        onTap: () => _removePhoto(entry.key),
                        child: Container(
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            size: 16,
                            color: Colors.red,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              }),
            ],
          ),
        ),

        const SizedBox(height: 8),
        CheckboxListTile(
          title: const Text('Is Hazardous Material?'),
          value: widget.item.isHazardous,
          onChanged: (val) {
            widget.onChanged(widget.item.copyWith(isHazardous: val ?? false));
          },
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    Function(String)? onChanged,
  }) {
    return TextFormField(
      controller: controller,
      decoration: _inputDecoration(label),
      keyboardType: keyboardType,
      onChanged: onChanged,
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: Colors.grey[50], // Slightly lighter than standard background
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
    );
  }
}
