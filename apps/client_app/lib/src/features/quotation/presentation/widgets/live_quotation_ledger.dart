import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../domain/quotation.dart';

class LiveQuotationLedger extends StatelessWidget {
  final Quotation quotation;

  const LiveQuotationLedger({super.key, required this.quotation});

  bool get _isPendingReview {
    return quotation.status == QuotationStatus.draft ||
        quotation.status == QuotationStatus.requestSent ||
        quotation.status == QuotationStatus.infoRequired;
  }

  String _renderPrice(double? price) {
    if (_isPendingReview || price == null || price == 0) {
      return 'TBD';
    }
    final formatCurrency = NumberFormat.simpleCurrency(name: 'USD');
    return formatCurrency.format(price);
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return DateFormat.yMMMMd('en_US').format(date);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 800),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade300),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(13), // 0.05 * 255 ≈ 13
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Section
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Top Left
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'QUOTATION',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 2,
                        color: Color(0xFF2563EB), // blue-600
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        border: Border.all(color: Colors.grey.shade200),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        (quotation.serviceType == 'Priority' ||
                                quotation.serviceType == 'Express')
                            ? 'High Priority Shipment'
                            : quotation.status.displayName,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'TO:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF374151), // gray-700
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      quotation.destination?.name ?? 'Customer Name',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1F2937), // gray-800
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${quotation.destination?.addressLine ?? ''}\n${quotation.destination?.city ?? ''}, ${quotation.destination?.state ?? ''} ${quotation.destination?.zip ?? ''}\n${quotation.destination?.country ?? ''}',
                      style: const TextStyle(color: Color(0xFF4B5563)),
                    ),
                    if (quotation.destination?.phone != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        '📞 ${quotation.destination!.phone}',
                        style: const TextStyle(color: Color(0xFF4B5563)),
                      ),
                    ],
                  ],
                ),
              ),

              // Top Right
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'B&B',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF1D4ED8), // blue-700
                      height: 1.0,
                    ),
                  ),
                  const Text(
                    'INTERNATIONAL',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1D4ED8),
                      height: 1.0,
                    ),
                  ),
                  const Text(
                    'Serving You Beyond Borders',
                    style: TextStyle(
                      fontSize: 10,
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF3B82F6), // blue-500
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildMetaRow(
                    'Quotation #:',
                    quotation.quotationId ?? quotation.id.substring(0, 8),
                  ),
                  _buildMetaRow(
                    'Quotation Date:',
                    _formatDate(quotation.createdDate),
                  ),
                  _buildMetaRow('Revision:', '0'),
                  _buildMetaRow(
                    'Validity:',
                    _formatDate(
                      quotation.createdDate.add(const Duration(days: 30)),
                    ),
                  ), // Assuming 30 days
                ],
              ),
            ],
          ),

          const SizedBox(height: 32),

          // Main Item Table
          Table(
            border: TableBorder.all(color: Colors.grey.shade300, width: 1),
            columnWidths: const {
              0: FixedColumnWidth(50), // ITEM NO.
              1: FlexColumnWidth(3), // COMMODITY DESCRIPTION
              2: FlexColumnWidth(1), // VOL / WGT
              3: FixedColumnWidth(50), // QTY
              4: FlexColumnWidth(1.2), // UNIT PRICE
              5: FlexColumnWidth(1.2), // TTL VALUE
            },
            children: [
              // Header Row
              TableRow(
                decoration: BoxDecoration(color: Colors.grey.shade50),
                children: [
                  _buildTableHeader('ITEM NO.', TextAlign.center),
                  _buildTableHeader('COMMODITY DESCRIPTION', TextAlign.left),
                  _buildTableHeader('VOL / WGT', TextAlign.center),
                  _buildTableHeader('QTY', TextAlign.center),
                  _buildTableHeader('UNIT PRICE', TextAlign.right),
                  _buildTableHeader('TTL VALUE', TextAlign.right),
                ],
              ),
              // Item Rows
              ...quotation.items.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                return TableRow(
                  children: [
                    _buildTableCell('${index + 1}', TextAlign.center),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.description,
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                          if (item.category.isNotEmpty)
                            Text(
                              item.category,
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.grey.shade500,
                              ),
                            ),
                        ],
                      ),
                    ),
                    _buildTableCell(
                      '${item.weight} kg\n${item.packingVolume != null ? '${item.packingVolume} cbm' : ''}',
                      TextAlign.center,
                    ),
                    _buildTableCell('${item.quantity}', TextAlign.center),
                    _buildTableCell(_renderPrice(item.cost), TextAlign.right),
                    _buildTableCell(
                      _renderPrice(item.cost * item.quantity),
                      TextAlign.right,
                      isBold: true,
                    ),
                  ],
                );
              }),
              // Empty State
              if (quotation.items.isEmpty)
                TableRow(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        'No items available currently.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                    const SizedBox(),
                    const SizedBox(),
                    const SizedBox(),
                    const SizedBox(),
                    const SizedBox(),
                  ],
                ),
            ],
          ),

          const SizedBox(height: 32),

          // Pricing & Freight Summary
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Terms & Conditions
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 32.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Terms & Conditions:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        quotation.additionalNotes ??
                            'Standard B&B International shipping terms apply. Liability limited as per standard waybill terms. Rates subject to final verification of weights and dimensions.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Summary Box
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    border: Border.all(color: Colors.grey.shade200),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(5), // 0.02 * 255 ≈ 5
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      _buildSummaryRow(
                        'Base Freight Charges',
                        _renderPrice(quotation.totalAmount),
                      ),
                      const SizedBox(height: 8),
                      _buildSummaryRow(
                        'Last Mile Delivery',
                        (quotation.status == QuotationStatus.addressProvided ||
                                quotation.status ==
                                    QuotationStatus.costCalculated)
                            ? 'Included'
                            : 'Pending Final Address',
                        valueStyle: TextStyle(
                          color: Colors.grey.shade500,
                          fontStyle: FontStyle.italic,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Divider(color: Colors.grey.shade300),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Final Quoted Amount',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1F2937), // gray-800
                            ),
                          ),
                          Text(
                            _renderPrice(quotation.totalAmount),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1D4ED8), // blue-700
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 48),

          // Footer
          Center(
            child: Column(
              children: [
                Text(
                  'This is a computer-generated document. No signature is required.',
                  style: TextStyle(fontSize: 10, color: Colors.grey.shade400),
                ),
                Text(
                  'B&B Logistics & Management Solutions',
                  style: TextStyle(fontSize: 10, color: Colors.grey.shade400),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetaRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 12,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(width: 4),
          Text(
            value,
            style: const TextStyle(fontSize: 12, color: Color(0xFF374151)),
          ),
        ],
      ),
    );
  }

  Widget _buildTableHeader(String text, TextAlign align) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12.0),
      child: Text(
        text,
        textAlign: align,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 12,
          color: Color(0xFF374151),
        ),
      ),
    );
  }

  Widget _buildTableCell(String text, TextAlign align, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Text(
        text,
        textAlign: align,
        style: TextStyle(
          fontSize: 13,
          fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          color: const Color(0xFF1F2937),
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {TextStyle? valueStyle}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: Color(0xFF374151)),
        ),
        Text(
          value,
          style:
              valueStyle ??
              const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Color(0xFF1F2937),
              ),
        ),
      ],
    );
  }
}
