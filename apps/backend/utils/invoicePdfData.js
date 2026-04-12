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
    const fd = q.fulfillmentDetails || {};
    const fromParts = [
        rd.originWarehouseName,
        [rd.originWarehouseCity, rd.originWarehouseState].filter(Boolean).join(', '),
        fd.pickupAddressLine,
        fd.senderName ? `Attn: ${fd.senderName}` : null,
        fd.senderPhone ? `Tel: ${fd.senderPhone}` : null,
    ].filter(Boolean);
    const fromHtml = fromParts.length ? fromParts.join('<br/>') : '—';

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

    const fmt0 = (v) =>
        `${sym}${Number(v || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const items = (q.items || []).map((item, index) => {
        const qty = item.quantity || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const amt = Number(item.amount) || 0;
        const lt = Number(item.lineTax) || 0;
        const img =
            item.images && item.images.length > 0 ? item.images[0] : '';
        const imageCell = img
            ? `<div style="display:flex;align-items:center;justify-content:center;"><img src="${img}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;display:block;"></div>`
            : '<div style="width:56px;height:56px;background:#f1f5f9;border:1px dashed #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8;margin:auto;">N/A</div>';

        // CBM from packingVolume (stored as cubic metres)
        const cbmRaw = Number(item.packingVolume) || 0;

        return {
            index: index + 1,
            description: item.description || '',
            category: item.category || '',
            isHazardous: !!item.isHazardous,
            qty,
            weight: item.weight ? Number(item.weight).toFixed(2) : '',
            cbm: cbmRaw ? cbmRaw.toFixed(3) : '',
            hsCode: item.hsCode && String(item.hsCode).trim() ? String(item.hsCode).trim() : '',
            unitPriceCell: isPendingReview
                ? '<span class="pending">Pending</span>'
                : formatMoney(unitPrice, '—'),
            taxCell: isPendingReview
                ? '<span class="pending">Pending</span>'
                : formatMoney(lt, '—'),
            lineTotalCell:
                isPendingReview || (amt === 0 && lt === 0)
                    ? '<span class="pending">Pending</span>'
                    : formatMoney(amt + lt),
            imageCell,
        };
    });

    const baseFreight = q.pricing?.baseFreightCharge ?? q.baseFreightCharge ?? 0;
    const handling = q.pricing?.estimatedHandlingFee ?? q.estimatedHandlingFee ?? 0;
    const itemsAmountSum = (q.items || []).reduce(
        (s, it) => s + (Number(it.amount) || 0),
        0,
    );
    // subtotal shown in the items section = item line amounts only (excl. freight/handling)
    const subtotalNumeric = itemsAmountSum;
    const shippingNumeric =
        Number(q.shippingCharge || 0) +
        Number(q.firstMileCharge || 0) +
        Number(q.lastMileCharge || 0);

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
        fromHtml,
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
        // Summary breakdown rows (shown conditionally if > 0)
        baseFreight: Number(baseFreight) > 0 ? fmt0(baseFreight) : '',
        handlingFee: Number(handling) > 0 ? fmt0(handling) : '',
        subtotal: fmt0(subtotalNumeric),
        shippingCharge: shippingNumeric > 0 ? fmt0(shippingNumeric) : '',
        tax: Number(q.tax) > 0 ? fmt0(q.tax) : '',
        discount: Number(q.discount) > 0 ? fmt0(q.discount) : '',
        totalAmount: fmt0(q.totalAmount),
        additionalNotes: q.additionalNotes || '',
        hasAdditionalNotes: !!(q.additionalNotes && String(q.additionalNotes).trim()),
        totalLabel: isPendingReview ? 'Quote Pending' : 'Grand Total',
        totalCell: isPendingReview
            ? '<span class="awaiting">Awaiting Admin Pricing</span>'
            : formatMoney(q.totalAmount),
    };
}

module.exports = { buildInvoiceLedgerData };
