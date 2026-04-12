/**
 * Builds plain data for quotation_invoice_ledger.html (aligned with admin LiveQuotationLedger).
 * @param {import('mongoose').Document} quotation - Populated Quotation (clientId, managerId optional)
 */
function buildInvoiceLedgerData(quotation) {
    const q = quotation.toObject ? quotation.toObject() : quotation;
    const cur = q.currency || 'USD';
    const CURRENCY_SYMBOL = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        AED: 'AED ',
        CNY: '¥',
        JPY: '¥',
        INR: '₹',
    };
    const sym = CURRENCY_SYMBOL[cur] || `${cur} `;

    const clientName = q.clientId?.fullName || 'Customer';

    const rd = q.routingData || {};
    const routingFrom =
        rd.originWarehouseCity || rd.sourceCity
            ? `From: ${rd.originWarehouseCity || rd.sourceCity || ''}${rd.originWarehouseState || rd.sourceRegion ? `, ${rd.originWarehouseState || rd.sourceRegion || ''}` : ''}`
            : '';
    const routingTo =
        rd.destinationWarehouseCity || rd.destinationCity
            ? `→ To: ${rd.destinationWarehouseCity || rd.destinationCity || ''}${rd.destinationWarehouseState || rd.destinationRegion ? `, ${rd.destinationWarehouseState || rd.destinationRegion || ''}` : ''}`
            : '';

    const statusRaw = q.status || '';
    const statusLabel = String(statusRaw).replace(/_/g, ' ');

    const isPendingReview =
        statusRaw === 'PENDING_ADMIN_REVIEW' || statusRaw === 'DRAFT';

    const formatMoney = (val, fallback = '—') => {
        if (val === null || val === undefined || Number(val) === 0) return fallback;
        return `${sym}${Number(val).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const items = (q.items || []).map((item, index) => {
        const qty = item.quantity || 1;
        const sc = item.shippingCharge ?? item.unitPrice ?? 0;
        const lineTotal = Number(sc) * qty;
        const weightLine = item.weight
            ? `${item.weight} kg${item.packingVolume ? `<br/>${item.packingVolume} CBM` : ''}`
            : '—';

        return {
            index: index + 1,
            description: item.description || '',
            category: item.category || '',
            isHazardous: !!item.isHazardous,
            quantity: qty,
            weightLine,
            declaredValue:
                item.declaredValue != null && item.declaredValue !== ''
                    ? formatMoney(item.declaredValue)
                    : '—',
            shippingCell: isPendingReview
                ? '<span class="pending">Pending</span>'
                : formatMoney(sc, '—'),
            lineTotalCell: isPendingReview || Number(sc) === 0
                ? '<span class="pending">Pending</span>'
                : formatMoney(lineTotal),
        };
    });

    const baseFreight = q.pricing?.baseFreightCharge ?? q.baseFreightCharge;
    const handling = q.pricing?.estimatedHandlingFee ?? q.estimatedHandlingFee;

    const termsText =
        q.termsAndConditions ||
        'Standard B&B International shipping terms apply. Liability limited as per standard waybill terms. Rates subject to final verification of weights and dimensions.';

    const created = q.createdAt ? new Date(q.createdAt) : new Date();
    const dateStr = created.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const validStr = q.validUntil
        ? new Date(q.validUntil).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '';

    return {
        clientName,
        statusLabel,
        routingFrom,
        routingTo,
        quotationId: q.quotationId || String(q._id || '').slice(-8),
        quotationNumber: q.quotationNumber || '',
        dateStr,
        revisionCount: q.revisionCount ?? 0,
        currencyCode: cur,
        validStr,
        mode: q.mode || '',
        serviceMode: q.serviceMode || '',
        hasModeExtras: !!(q.mode || q.serviceMode),
        items,
        hasItems: items.length > 0,
        isPendingReview,
        showBaseFreight: (baseFreight ?? 0) > 0,
        baseFreight: formatMoney(baseFreight),
        showHandling: (handling ?? 0) > 0,
        handling: formatMoney(handling),
        showFirstMile: (q.firstMileCharge ?? 0) > 0,
        firstMile: formatMoney(q.firstMileCharge),
        showLastMile: (q.lastMileCharge ?? 0) > 0,
        lastMile: formatMoney(q.lastMileCharge),
        showTax: (q.tax ?? 0) > 0,
        taxLabel: q.taxRate != null ? `Tax (${q.taxRate}%)` : 'Tax',
        tax: formatMoney(q.tax),
        showDiscount: (q.discount ?? 0) > 0,
        discount: formatMoney(q.discount),
        showFallbackTotalLine:
            (baseFreight ?? 0) === 0 &&
            (q.totalAmount ?? 0) > 0 &&
            !isPendingReview,
        fallbackTotal: formatMoney(q.totalAmount),
        totalLabel: isPendingReview ? 'Quote Pending' : 'Final Quoted Amount',
        totalCell: isPendingReview
            ? '<span class="awaiting">Awaiting Admin Pricing</span>'
            : formatMoney(q.totalAmount),
        termsText,
        additionalNotes: q.additionalNotes || '',
        hasAdditionalNotes: !!(q.additionalNotes && String(q.additionalNotes).trim()),
    };
}

module.exports = { buildInvoiceLedgerData };
