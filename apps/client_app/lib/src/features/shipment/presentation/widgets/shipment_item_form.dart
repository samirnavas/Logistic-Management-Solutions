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
  /// Per-box CBM from dimensions in cm: (L×B×H) / 1e6; total CBM = per-box × box count.
  int _parseBoxCountForForm() {
    final t = _quantityController.text.trim();
    if (t.isEmpty) return 1;
    return int.tryParse(t) ?? 0;
  }

  void _syncTotalCbmFromInputs() {
    final a = double.tryParse(_lengthController.text.trim()) ?? 0;
    final b = double.tryParse(_widthController.text.trim()) ?? 0;
    final c = double.tryParse(_heightController.text.trim()) ?? 0;
    if (a <= 0 || b <= 0 || c <= 0) {
      _volumeController.clear();
      return;
    }
    final perBoxCbm = (a * b * c) / 1000000;
    final boxes = _parseBoxCountForForm();
    final total = perBoxCbm * boxes;
    _volumeController.text = total.toStringAsFixed(3);
  }

  static const _categoryOptions = [
    'General',
    'Special',
    'Harmful',
    'Explosive',
  ];
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

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.item.description);

    _quantityController = TextEditingController(
      text: widget.item.quantity == 1 ? '' : widget.item.quantity.toString(),
    );
    _weightController = TextEditingController(
      text: widget.item.weight == 0.0 ? '' : widget.item.weight.toString(),
    );

    final dims = widget.item.dimensions.toString().split('x');
    final lenStr = dims.isNotEmpty ? dims[0] : '';
    final widStr = dims.length > 1 ? dims[1] : '';
    final hgtStr = dims.length > 2 ? dims[2] : '';
    _lengthController = TextEditingController(text: lenStr);
    _widthController = TextEditingController(text: widStr);
    _heightController = TextEditingController(text: hgtStr);

    _targetRateController = TextEditingController(
      text: widget.item.targetRate?.toString() ?? '',
    );
    _videoUrlController = TextEditingController(
      text: widget.item.videoUrl ?? '',
    );
    final packed = widget.item.packingVolume;
    String volText = packed != null ? packed.toString() : '';
    if (packed == null) {
      final a = double.tryParse(lenStr.trim()) ?? 0;
      final b = double.tryParse(widStr.trim()) ?? 0;
      final c = double.tryParse(hgtStr.trim()) ?? 0;
      if (a > 0 && b > 0 && c > 0) {
        final perBox = (a * b * c) / 1000000;
        final n = widget.item.quantity <= 0 ? 0 : widget.item.quantity;
        volText = (perBox * n).toStringAsFixed(3);
      }
    }
    _volumeController = TextEditingController(text: volText);
    _hsCodeController = TextEditingController(text: widget.item.hsCode ?? '');
  }

  @override
  void didUpdateWidget(covariant ShipmentItemForm oldWidget) {
    super.didUpdateWidget(oldWidget);
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
    _syncTotalCbmFromInputs();
    _updateItem();
  }

  void _onQuantityOrDimensionsForCbm() {
    _syncTotalCbmFromInputs();
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
              '$h';

    final qty = _parseBoxCountForForm();
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
    );
    widget.onChanged(newItem);
  }

  Future<void> _pickPhotos() async {
    final List<XFile> pickedFiles = await _picker.pickMultiImage();
    if (pickedFiles.isNotEmpty) {
      final newPhotos = pickedFiles.map((e) => File(e.path)).toList();
      final updatedPhotos = [...widget.item.localPhotos, ...newPhotos];
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
        _buildFieldLabel('HS CODE (REQUIRED)'),
        _buildTextField(
          controller: _hsCodeController,
          hint: 'e.g. hs730456',
          onChanged: (v) => _updateItem(),
        ),
        const SizedBox(height: 14),
        _buildFieldLabel('PRODUCT DESCRIPTION'),
        _buildTextField(
          controller: _nameController,
          hint: 'e.g. Industrial Steel Pipes',
          onChanged: (v) => _updateItem(),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(child: _buildFieldLabel('LENGTH (CM)')),
            const SizedBox(width: 10),
            Expanded(child: _buildFieldLabel('BREADTH (CM)')),
            const SizedBox(width: 10),
            Expanded(child: _buildFieldLabel('HEIGHT (CM)')),
          ],
        ),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                controller: _lengthController,
                hint: '0',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (v) => _onDimensionsChanged(),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildTextField(
                controller: _widthController,
                hint: '0',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (v) => _onDimensionsChanged(),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildTextField(
                controller: _heightController,
                hint: '0',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (v) => _onDimensionsChanged(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(child: _buildFieldLabel('QUANTITY (BOXES)')),
            const SizedBox(width: 10),
            Expanded(child: _buildFieldLabel('WEIGHT (KG)')),
          ],
        ),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                controller: _quantityController,
                hint: '0',
                keyboardType: TextInputType.number,
                onChanged: (v) => _onQuantityOrDimensionsForCbm(),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildTextField(
                controller: _weightController,
                hint: '0.00',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (v) => _updateItem(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        _buildFieldLabel('TOTAL VOL (CBM)'),
        _buildTextField(
          controller: _volumeController,
          hint: 'Per box L×B×H (cm) × boxes',
          readOnly: true,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(child: _buildFieldLabel('CATEGORY')),
            const SizedBox(width: 10),
            Expanded(child: _buildFieldLabel('DECLARED VALUE')),
          ],
        ),
        Row(
          children: [
            Expanded(
              child: InputDecorator(
                decoration: _inputDecoration(),
                child: _buildStyledDropdown(
                  value: widget.item.category,
                  values: _categoryOptions,
                  onChanged: (val) {
                    if (val != null) {
                      widget.onChanged(widget.item.copyWith(category: val));
                    }
                  },
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildTextField(
                controller: _targetRateController,
                hint: '₹ 0.00',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (v) => _updateItem(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildHazardousToggleCard(),
        const SizedBox(height: 16),
        _buildFieldLabel('PRODUCT PHOTOS'),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: _pickPhotos,
          child: CustomPaint(
            painter: const _DashedRRectPainter(color: Color(0xFFCAD1DF)),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 22),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Column(
                children: [
                  Icon(
                    Icons.add_photo_alternate_outlined,
                    color: Color(0xFF3658A8),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Tap to upload photos',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'MAX 5 FILES (JPG, PNG)',
                    style: TextStyle(
                      fontSize: 10,
                      color: Color(0xFF9CA3AF),
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (widget.item.localPhotos.isNotEmpty) ...[
          const SizedBox(height: 10),
          SizedBox(
            height: 72,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: widget.item.localPhotos.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final file = widget.item.localPhotos[index];
                return Stack(
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        image: DecorationImage(
                          image: FileImage(file),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    Positioned(
                      top: 2,
                      right: 2,
                      child: GestureDetector(
                        onTap: () => _removePhoto(index),
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            size: 14,
                            color: Colors.red,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildFieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          color: Color(0xFF6B7280),
          fontWeight: FontWeight.w700,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _buildHazardousToggleCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF7DCC6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.warning_amber_rounded,
            size: 19,
            color: Color(0xFF7A4A1A),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Hazardous Material',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF3F2A14),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Switch(
            value: widget.item.isHazardous,
            onChanged: (val) {
              widget.onChanged(widget.item.copyWith(isHazardous: val));
            },
            activeThumbColor: const Color(0xFFE6A86A),
            activeTrackColor: const Color(0xFFD58D49),
            inactiveThumbColor: Colors.white,
            inactiveTrackColor: const Color(0xFFE5C4A4),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    TextInputType? keyboardType,
    Function(String)? onChanged,
    bool readOnly = false,
  }) {
    return TextFormField(
      controller: controller,
      decoration: _inputDecoration(hint: hint),
      keyboardType: keyboardType,
      onChanged: onChanged,
      readOnly: readOnly,
    );
  }

  Widget _buildStyledDropdown({
    required String value,
    required List<String> values,
    required ValueChanged<String?> onChanged,
  }) {
    final style = Theme.of(context).textTheme.bodyMedium?.copyWith(
      color: Colors.black87,
      fontWeight: FontWeight.w600,
      fontSize: 14,
    );

    return DropdownButtonHideUnderline(
      child: DropdownButton<String>(
        value: values.contains(value) ? value : values.first,
        isDense: true,
        isExpanded: true,
        alignment: AlignmentDirectional.centerStart,
        borderRadius: BorderRadius.circular(16),
        dropdownColor: Colors.white,
        elevation: 12,
        menuMaxHeight: 320,
        itemHeight: 48,
        icon: Icon(
          Icons.keyboard_arrow_down_rounded,
          color: Colors.grey.shade600,
          size: 22,
        ),
        style: style,
        selectedItemBuilder: (context) {
          return values
              .map(
                (v) => Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(
                    v,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: style,
                  ),
                ),
              )
              .toList();
        },
        items: values
            .map(
              (e) => DropdownMenuItem(
                value: e,
                child: Text(e, maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
            )
            .toList(),
        onChanged: onChanged,
      ),
    );
  }

  InputDecoration _inputDecoration({String? hint}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        fontSize: 14,
        color: Color(0xFF9CA3AF),
        fontWeight: FontWeight.w500,
      ),
      filled: true,
      fillColor: const Color(0xFFF1F2F7),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF9AA4B2), width: 1),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
    );
  }
}

class _DashedRRectPainter extends CustomPainter {
  final Color color;

  const _DashedRRectPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    const borderRadius = 14.0;
    const strokeWidth = 1.2;
    const dashWidth = 6.0;
    const dashGap = 4.0;
    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(
      rect,
      const Radius.circular(borderRadius),
    );
    final path = Path()..addRRect(rrect);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    for (final metric in path.computeMetrics()) {
      double distance = 0;
      while (distance < metric.length) {
        final end = (distance + dashWidth > metric.length)
            ? metric.length
            : distance + dashWidth;
        canvas.drawPath(metric.extractPath(distance, end), paint);
        distance += dashWidth + dashGap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRRectPainter oldDelegate) {
    return oldDelegate.color != color;
  }
}
