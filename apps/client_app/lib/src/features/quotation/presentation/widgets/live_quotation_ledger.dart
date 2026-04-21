import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:bb_logistics/src/core/utils/currency_utils.dart' as cu;
import '../../domain/quotation.dart';

class LiveQuotationLedger extends StatelessWidget {
  final Quotation quotation;

  const LiveQuotationLedger({super.key, required this.quotation});

  bool get _isPendingReview {
    return quotation.status == QuotationStatus.draft ||
        quotation.status == QuotationStatus.requestSent ||
        quotation.status == QuotationStatus.infoRequired;
  }

  String get _currencyName => quotation.currency ?? 'INR';

  NumberFormat get _currencyFormat => cu.currencyFormat(_currencyName);

  String get _zeroFormatted => _currencyFormat.format(0);

  String _renderPrice(double? price, {bool showZero = false}) {
    if (_isPendingReview || price == null) {
      return 'TBD';
    }
    if (price <= 0 && showZero) {
      return _zeroFormatted;
    }
    return _currencyFormat.format(price);
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return DateFormat.yMMMMd('en_US').format(date);
  }

  List<String> _fromLines() {
    final lines = <String>[];
    final wh = quotation.originWarehouseName;
    if (wh != null && wh.isNotEmpty) lines.add(wh);
    final city = quotation.originWarehouseCity;
    final st = quotation.originWarehouseState;
    if ((city != null && city.isNotEmpty) || (st != null && st.isNotEmpty)) {
      lines.add([city, st].whereType<String>().where((e) => e.isNotEmpty).join(', '));
    }
    final origin = quotation.origin;
    if (origin != null && origin.addressLine.isNotEmpty) {
      lines.add(origin.addressLine);
    }
    return lines;
  }

  double get _itemsAmountSum =>
      quotation.items.fold(0.0, (s, it) => s + it.cost);

  double get _subtotalNumeric =>
      _itemsAmountSum +
      (quotation.baseFreightCharge ?? 0) +
      (quotation.estimatedHandlingFee ?? 0);

  double get _shippingNumeric =>
      (quotation.shippingCharge ?? 0) +
      (quotation.firstMileCharge ?? 0) +
      (quotation.lastMileCharge ?? 0);

  @override
  Widget build(BuildContext context) {
    final fromLines = _fromLines();

    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 800),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade300),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(13),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 24,
            runSpacing: 24,
            crossAxisAlignment: WrapCrossAlignment.start,
            children: [
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
                        color: Color(0xFF2563EB),
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
                        quotation.status.displayName,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade800,
                        ),
                      ),
                    ),
                    if (fromLines.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          border: Border.all(color: Colors.grey.shade300),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'FROM:',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue.shade800,
                              ),
                            ),
                            const SizedBox(height: 6),
                            ...fromLines.map(
                              (l) => Padding(
                                padding: const EdgeInsets.only(bottom: 2),
                                child: Text(
                                  l,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF374151),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    const Text(
                      'TO:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF374151),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      quotation.clientName ?? 'Customer Name',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1F2937),
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
                        color: Color(0xFF1D4ED8),
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
                        color: Color(0xFF3B82F6),
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
                    _buildMetaRow(
                      'Revision:',
                      '${quotation.revisionCount ?? 0}',
                    ),
                    _buildMetaRow('Currency:', quotation.currency ?? 'INR'),
                    _buildMetaRow(
                      'Validity:',
                      _formatDate(
                        quotation.createdDate.add(const Duration(days: 30)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 32),

          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SizedBox(
              width: 760,
              child: Table(
                border: TableBorder.all(color: Colors.grey.shade300, width: 1),
                columnWidths: const {
                  0: FixedColumnWidth(36),
                  1: FlexColumnWidth(2.2),
                  2: FixedColumnWidth(72),
                  3: FixedColumnWidth(88),
                  4: FixedColumnWidth(72),
                  5: FixedColumnWidth(88),
                },
                children: [
                  TableRow(
                    decoration: BoxDecoration(color: Colors.grey.shade50),
                    children: [
                      _buildTableHeader('#', TextAlign.center),
                      _buildTableHeader('ITEM / DESCRIPTION', TextAlign.left),
                      _buildTableHeader('IMAGE', TextAlign.center),
                      _buildTableHeader('HS CODE', TextAlign.left),
                      _buildTableHeader('TAX', TextAlign.right),
                      _buildTableHeader('LINE TOTAL', TextAlign.right),
                    ],
                  ),
                  ...quotation.items.asMap().entries.map((entry) {
                    final index = entry.key;
                    final item = entry.value;
                    final lt = item.lineTax ?? 0;
                    final lineTotal = item.cost + lt;
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
                        Padding(
                          padding: const EdgeInsets.all(4),
                          child: _itemThumb(item),
                        ),
                        _buildTableCell(
                          item.hsCode.isNotEmpty ? item.hsCode : '—',
                          TextAlign.left,
                        ),
                        _buildTableCell(
                          _isPendingReview
                              ? 'TBD'
                              : _renderPrice(lt, showZero: true),
                          TextAlign.right,
                        ),
                        _buildTableCell(
                          _isPendingReview || (item.cost == 0 && lt == 0)
                              ? 'TBD'
                              : _renderPrice(lineTotal, showZero: true),
                          TextAlign.right,
                          isBold: true,
                        ),
                      ],
                    );
                  }),
                  if (quotation.items.isEmpty)
                    TableRow(
                      children: [
                        const SizedBox.shrink(),
                        Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Center(
                            child: Text(
                              'No items available currently.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.grey.shade500,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox.shrink(),
                        const SizedBox.shrink(),
                        const SizedBox.shrink(),
                        const SizedBox.shrink(),
                      ],
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 32),

          LayoutBuilder(
            builder: (context, constraints) {
              final isMobile = constraints.maxWidth < 600;
              return Flex(
                direction: isMobile ? Axis.vertical : Axis.horizontal,
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
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
                            'Terms & Conditions (Short Version)',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          const SizedBox(height: 8),
                          _termsParagraph(
                            'Payment: 50% advance, balance 50% payable within 20 days from invoice/shipment date.',
                          ),
                          _termsParagraph(
                            'Delivery: Timelines are approximate. Delays due to natural calamities, war, pandemic, port congestion, or customs/legal procedures are not our responsibility.',
                          ),
                          _termsParagraph(
                            'Customer Information: Customer must provide accurate product details and documents. We are not liable for losses due to incorrect or incomplete information.',
                          ),
                          _termsParagraph(
                            'Penalties: Any fines, penalties, or charges arising from wrong declaration will be borne by the customer.',
                          ),
                          _termsParagraph(
                            'Certifications: Customer must provide all required certifications (e.g., CE, BIS, SABER/SABRE, etc.) as applicable.',
                          ),
                          _termsParagraph(
                            'Packaging: Goods must be packed as per our instructions. We are not responsible for damage due to improper packaging.',
                          ),
                          _termsParagraph(
                            'Customs Issues: Any delay, detention, or seizure due to documentation errors or non-compliance will be at customer’s risk and cost.',
                          ),
                          _termsParagraph(
                            'Shipment Impact: If one customer’s cargo affects clearance of the full shipment/container, all related charges will be borne by that customer.',
                          ),
                          _termsParagraph(
                            'Liability: Our liability is limited to service charges only. No responsibility for indirect or consequential losses.',
                          ),
                          _termsParagraph(
                            'Acceptance: Payment or order confirmation implies acceptance of these terms.',
                          ),
                        ],
                      ),
                    ),
                  ),
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
                              color: Colors.black.withAlpha(5),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _buildSummaryRow(
                              'Subtotal',
                              _isPendingReview
                                  ? '—'
                                  : _renderPrice(_subtotalNumeric, showZero: true),
                            ),
                            const SizedBox(height: 8),
                            _buildSummaryRow(
                              'Shipping Charge',
                              _isPendingReview
                                  ? '—'
                                  : _renderPrice(_shippingNumeric, showZero: true),
                            ),
                            const SizedBox(height: 8),
                            _buildSummaryRow(
                              'Tax',
                              _isPendingReview
                                  ? '—'
                                  : _renderPrice(quotation.tax, showZero: true),
                            ),
                            const SizedBox(height: 8),
                            _buildSummaryRow(
                              'Discount',
                              '-${_renderPrice(quotation.discount, showZero: true)}',
                              valueStyle: const TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Divider(color: Colors.grey.shade300),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    _isPendingReview
                                        ? 'Quote Pending'
                                        : 'Grand Total',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF1F2937),
                                    ),
                                  ),
                                ),
                                Flexible(
                                  child: _isPendingReview
                                      ? const Text(
                                          'Awaiting Admin Pricing',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontStyle: FontStyle.italic,
                                            color: Colors.deepOrange,
                                          ),
                                          textAlign: TextAlign.end,
                                        )
                                      : Text(
                                          _renderPrice(
                                            quotation.totalAmount,
                                            showZero: true,
                                          ),
                                          style: const TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF1D4ED8),
                                          ),
                                          textAlign: TextAlign.end,
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

  Widget _termsParagraph(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: TextStyle(fontSize: 11, height: 1.45, color: Colors.grey.shade700),
      ),
    );
  }

  Widget _itemThumb(QuotationItem item) {
    if (item.images.isEmpty) {
      return Container(
        width: 48,
        height: 48,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text('N/A', style: TextStyle(fontSize: 9, color: Colors.grey.shade600)),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: Image.network(
        item.images.first,
        width: 48,
        height: 48,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Container(
          width: 48,
          height: 48,
          color: Colors.grey.shade100,
          alignment: Alignment.center,
          child: const Text('N/A', style: TextStyle(fontSize: 9)),
        ),
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
      padding: const EdgeInsets.symmetric(horizontal: 6.0, vertical: 10.0),
      child: Text(
        text,
        textAlign: align,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 11,
          color: Color(0xFF374151),
        ),
      ),
    );
  }

  Widget _buildTableCell(String text, TextAlign align, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.all(6.0),
      child: Text(
        text,
        textAlign: align,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          color: const Color(0xFF1F2937),
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {TextStyle? valueStyle}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontSize: 14, color: Color(0xFF374151)),
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            value,
            style:
                valueStyle ??
                const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF1F2937),
                ),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }
}
