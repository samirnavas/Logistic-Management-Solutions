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
    if (_isPendingReview || price == null || price <= 0) {
      return 'TBD';
    }
    final currencyName = quotation.currency ?? 'USD';
    final formatCurrency = NumberFormat.simpleCurrency(name: currencyName);
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
          Wrap(
            spacing: 24,
            runSpacing: 24,
            crossAxisAlignment: WrapCrossAlignment.start,
            children: [
              // Top Left
              SizedBox(
                width: 300,
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
                      quotation.clientName ?? 'Customer Name',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1F2937), // gray-800
                      ),
                    ),
                    const SizedBox(height: 4),
                    DefaultTextStyle(
                      style: const TextStyle(
                        color: Color(0xFF4B5563),
                        fontSize: 13,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (quotation.routingSourceCity != null)
                            Text(
                              'From: ${quotation.routingSourceCity}${quotation.routingSourceRegion != null ? ', ${quotation.routingSourceRegion}' : ''}',
                            ),
                          if (quotation.routingDestinationCity != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '→ To: ${quotation.routingDestinationCity}${quotation.routingDestinationRegion != null ? ', ${quotation.routingDestinationRegion}' : ''}',
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Top Right
              SizedBox(
                width: 300,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
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
                    _buildMetaRow('Currency:', quotation.currency ?? 'USD'),
                    _buildMetaRow(
                      'Validity:',
                      _formatDate(
                        quotation.createdDate.add(const Duration(days: 30)),
                      ),
                    ), // Assuming 30 days
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 32),

          // Main Item Table Wrapper (Horizontal Scroll on Mobile)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SizedBox(
              width: 800, // Enforce min-width so text doesn't collapse
              child: Table(
                border: TableBorder.all(color: Colors.grey.shade300, width: 1),
                columnWidths: const {
                  0: FixedColumnWidth(40), // ITEM NO.
                  1: FlexColumnWidth(2.5), // COMMODITY DESCRIPTION
                  2: FixedColumnWidth(50), // QTY
                  3: FlexColumnWidth(1), // VOL / WGT
                  4: FlexColumnWidth(1.2), // DECLARED VALUE
                  5: FlexColumnWidth(1.2), // SHIPPING CHARGE
                  6: FlexColumnWidth(1.2), // TTL VALUE
                },
                children: [
                  // Header Row
                  TableRow(
                    decoration: BoxDecoration(color: Colors.grey.shade50),
                    children: [
                      _buildTableHeader('NO.', TextAlign.center),
                      _buildTableHeader('DESCRIPTION', TextAlign.left),
                      _buildTableHeader('QTY', TextAlign.center),
                      _buildTableHeader('WGT/VOL', TextAlign.center),
                      _buildTableHeader('DECLARED\nVALUE', TextAlign.right),
                      _buildTableHeader('SHIPPING\nCHARGE', TextAlign.right),
                      _buildTableHeader('LINE\nTOTAL', TextAlign.right),
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
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              if (item.category.isNotEmpty)
                                Text(
                                  item.category,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey.shade500,
                                  ),
                                ),
                              if (item.isHazardous)
                                const Text(
                                  '⚠ Hazardous',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.red,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        _buildTableCell('${item.quantity}', TextAlign.center),
                        _buildTableCell(
                          '${item.weight} kg\n${item.packingVolume != null ? '${item.packingVolume} cbm' : ''}',
                          TextAlign.center,
                        ),
                        _buildTableCell(
                          item.declaredValue != null
                              ? _renderPrice(item.declaredValue)
                              : '—',
                          TextAlign.right,
                        ),
                        _buildTableCell(
                          _renderPrice(item.shippingCharge ?? item.cost),
                          TextAlign.right,
                        ),
                        _buildTableCell(
                          _renderPrice(
                            (item.shippingCharge ?? item.cost) * item.quantity,
                          ),
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
                        const SizedBox(),
                      ],
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 32),

          // Pricing & Freight Summary
          LayoutBuilder(
            builder: (context, constraints) {
              bool isMobile = constraints.maxWidth < 600;
              return Flex(
                direction: isMobile ? Axis.vertical : Axis.horizontal,
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Terms & Conditions
                  Flexible(
                    flex: isMobile ? 0 : 1,
                    fit: isMobile ? FlexFit.loose : FlexFit.tight,
                    child: Padding(
                      padding: EdgeInsets.only(
                        right: isMobile ? 0 : 32.0,
                        bottom: isMobile ? 24.0 : 0,
                      ),
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
                  Flexible(
                    flex: isMobile ? 0 : 1,
                    fit: isMobile ? FlexFit.loose : FlexFit.tight,
                    child: SizedBox(
                      width: double.infinity,
                      child: Container(
                        padding: const EdgeInsets.all(16.0),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          border: Border.all(color: Colors.grey.shade200),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withAlpha(
                                5,
                              ), // 0.02 * 255 ≈ 5
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            if ((quotation.baseFreightCharge ?? 0) > 0) ...[
                              _buildSummaryRow(
                                'Base Freight Charge',
                                _renderPrice(quotation.baseFreightCharge),
                              ),
                              const SizedBox(height: 8),
                            ],
                            if ((quotation.estimatedHandlingFee ?? 0) > 0) ...[
                              _buildSummaryRow(
                                'Estimated Handling Fee',
                                _renderPrice(quotation.estimatedHandlingFee),
                              ),
                              const SizedBox(height: 8),
                            ],
                            if ((quotation.firstMileCharge ?? 0) > 0) ...[
                              _buildSummaryRow(
                                'First Mile Charge',
                                _renderPrice(quotation.firstMileCharge),
                              ),
                              const SizedBox(height: 8),
                            ],
                            if ((quotation.lastMileCharge ?? 0) > 0) ...[
                              _buildSummaryRow(
                                'Last Mile Charge',
                                _renderPrice(quotation.lastMileCharge),
                              ),
                              const SizedBox(height: 8),
                            ],
                            if ((quotation.tax ?? 0) > 0) ...[
                              _buildSummaryRow(
                                'Tax',
                                _renderPrice(quotation.tax),
                              ),
                              const SizedBox(height: 8),
                            ],
                            if ((quotation.discount ?? 0) > 0) ...[
                              _buildSummaryRow(
                                'Discount',
                                '-${_renderPrice(quotation.discount)}',
                                valueStyle: const TextStyle(
                                  color: Colors.green,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                            ],

                            // Fallback if no specific charges are mapped yet, just to avoid an empty box
                            if ((quotation.baseFreightCharge ?? 0) == 0 &&
                                quotation.totalAmount > 0 &&
                                !_isPendingReview) ...[
                              _buildSummaryRow(
                                'Base Freight Charges',
                                _renderPrice(quotation.totalAmount),
                              ),
                              const SizedBox(height: 8),
                            ],

                            const SizedBox(height: 4),
                            Divider(color: Colors.grey.shade300),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  _isPendingReview
                                      ? 'Quote Pending'
                                      : 'Final Quoted Amount',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1F2937), // gray-800
                                  ),
                                ),
                                _isPendingReview
                                    ? const Text(
                                        'Awaiting Admin Pricing',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontStyle: FontStyle.italic,
                                          color: Colors.deepOrange,
                                        ),
                                      )
                                    : Text(
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
                  ),
                ],
              );
            },
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
