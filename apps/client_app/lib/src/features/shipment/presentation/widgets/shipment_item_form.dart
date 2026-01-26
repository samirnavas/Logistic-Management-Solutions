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
  late TextEditingController _dimensionsController;
  late TextEditingController _targetRateController;
  late TextEditingController _videoUrlController;
  late TextEditingController _volumeController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.item.description);
    _quantityController = TextEditingController(
      text: widget.item.quantity.toString(),
    );
    _weightController = TextEditingController(
      text: widget.item.weight.toString(),
    );
    _dimensionsController = TextEditingController(
      text: widget.item.dimensions.toString(),
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
  }

  @override
  void didUpdateWidget(covariant ShipmentItemForm oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.item != oldWidget.item) {
      if (_nameController.text != widget.item.description) {
        _nameController.text = widget.item.description;
      }
      // Only update numeric fields if they are different and valid
      if (int.tryParse(_quantityController.text) != widget.item.quantity) {
        _quantityController.text = widget.item.quantity.toString();
      }
      // ... similar checks for others if needed, but simple reassignment can cause cursor jumps
      // For this implementation, we assume the parent updates are driven by this form, so minimal loopback issues.

      // Update photos if list changed length (simple heuristic)
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _weightController.dispose();
    _dimensionsController.dispose();
    _targetRateController.dispose();
    _videoUrlController.dispose();
    _volumeController.dispose();
    super.dispose();
  }

  void _updateItem() {
    final newItem = widget.item.copyWith(
      description: _nameController.text,
      quantity: int.tryParse(_quantityController.text) ?? 1,
      weight: double.tryParse(_weightController.text) ?? 0.0,
      dimensions: _dimensionsController.text,
      targetRate: double.tryParse(_targetRateController.text),
      videoUrl: _videoUrlController.text,
      packingVolume: double.tryParse(_volumeController.text),
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
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: ExpansionTile(
        initiallyExpanded: widget.isExpanded,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          widget.item.description.isEmpty
              ? 'Item ${widget.index + 1}'
              : widget.item.description,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          '${widget.item.quantity} Boxes • ${widget.item.weight} kg',
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              onPressed: widget.onRemove,
            ),
            const Icon(Icons.expand_more),
          ],
        ),
        childrenPadding: const EdgeInsets.all(16),
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
                  controller: _dimensionsController,
                  label: 'Dimensions (LxWxH cm)',
                  onChanged: (v) => _updateItem(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  controller: _volumeController,
                  label: 'Volume (CBM)',
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  onChanged: (v) => _updateItem(),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),
          // 2. Category & Priority (Dropdowns)
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: widget.item.category,
                  decoration: _inputDecoration('Category'),
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
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: widget.item.priority,
                  decoration: _inputDecoration('Priority'),
                  items: ['Standard', 'Express']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) {
                      widget.onChanged(widget.item.copyWith(priority: val));
                    }
                  },
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),
          // 3. Extra Details
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _targetRateController,
                  label: 'Target Rate (USD)',
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  onChanged: (v) => _updateItem(),
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
        ],
      ),
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
