/**
 * PDF data mappers for pro-forma quotations (quotation.html) and tax invoices (quotation_invoice_ledger.html).
 * @param {import('mongoose').Document | object} quotation - Quotation (clientId, managerId optional)
 */

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatDateGB(d) {
    return new Date(d).toLocaleDateString('en-GB');
}

function formatDateUSLong(d) {
    return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function yyyymmdd(d) {
    const x = new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
}

/**
 * Data for apps/backend/templates/quotation.html (pro-forma quotation / estimate).
 */
function buildQuotationPdfData(quotation) {
    const q = quotation.toObject ? quotation.toObject() : quotation;

    const formatCurrency = (amount) => {
        const n = Number(amount) || 0;
        return n.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const curSym =
        q.currency === 'USD'
            ? '$'
            : q.currency === 'INR'
              ? '₹'
              : `${q.currency} `;

    const created = q.createdAt ? new Date(q.createdAt) : new Date();
    const quoteValidityDate = q.validUntil
        ? new Date(q.validUntil)
        : addDays(created, 7);

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

    const dest = q.destination || {};
    const itemsSubtotal = (q.items || []).reduce(
        (s, it) => s + (Number(it.amount) || 0),
        0,
    );

    return {
        fromHtml,
        clientName: q.clientId?.fullName || 'Customer',
        clientAddress: dest.addressLine
            ? `${dest.addressLine}, ${dest.city || ''}`
            : q.clientId?.email || '',
        clientPhone: q.clientId?.phone || dest.phone || '',
        quotationId: q.quotationId || q.quotationNumber,
        date: formatDateGB(created),
        quoteValidityDate: formatDateGB(quoteValidityDate),
        currencySymbol: curSym,
        items: (q.items || []).map((item, index) => {
            const amt = Number(item.amount) || 0;
            const lt = Number(item.lineTax) || 0;
            const cbmRaw = Number(item.packingVolume) || 0;
            const w = item.weight;
            const hasWeight = w !== null && w !== undefined && w !== '';
            return {
                index: index + 1,
                description: item.description || '',
                imageUrl:
                    item.imageUrl ? item.imageUrl : (item.images && item.images.length > 0 ? item.images[0] : (q.productPhotos && q.productPhotos.length > 0 ? q.productPhotos[0] : '')),
                weightDisplay: hasWeight
                    ? `${Number(w).toFixed(2)} kg`
                    : '—',
                cbmDisplay: cbmRaw
                    ? `${cbmRaw.toFixed(3)} CBM`
                    : '—',
                hsCode:
                    item.hsCode && String(item.hsCode).trim()
                        ? String(item.hsCode).trim()
                        : '',
                taxFormatted: `${curSym}${formatCurrency(lt)}`,
                lineTotalFormatted: `${curSym}${formatCurrency(amt + lt)}`,
            };
        }),
        subtotal: `${curSym}${formatCurrency(itemsSubtotal)}`,
        shippingCharge: `${curSym}${formatCurrency(q.shippingCharge)}`,
        tax: `${curSym}${formatCurrency(q.tax)}`,
        discount: `${curSym}${formatCurrency(q.discount)}`,
        totalAmount: `${curSym}${formatCurrency(q.totalAmount)}`,
    };
}

/**
 * Data for apps/backend/templates/quotation_invoice_ledger.html (tax invoice).
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
        if (val === null || val === undefined || Number(val) === 0)
            return fallback;
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
        const amt = Number(item.amount) || 0;
        const lt = Number(item.lineTax) || 0;
        const img =
            item.imageUrl ? item.imageUrl : (item.images && item.images.length > 0 ? item.images[0] : (q.productPhotos && q.productPhotos.length > 0 ? q.productPhotos[0] : ''));
        const imageCell = img
            ? `<div style="display:flex;align-items:center;justify-content:center;"><img src="${img}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;display:block;"></div>`
            : '<div style="width:56px;height:56px;background:#f1f5f9;border:1px dashed #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8;margin:auto;">N/A</div>';

        const hsRaw = item.hsCode != null ? String(item.hsCode).trim() : '';
        const hsCode = hsRaw || '';

        return {
            index: index + 1,
            description: item.description || '',
            category: item.category || '',
            isHazardous: !!item.isHazardous,
            hsCode,
            hsCodeCell: hsRaw
                ? `<span class="hs-code">${hsRaw}</span>`
                : '—',
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
    const subtotalNumeric = itemsAmountSum;
    const shippingNumeric =
        Number(q.shippingCharge || 0) +
        Number(q.firstMileCharge || 0) +
        Number(q.lastMileCharge || 0);

    const created = q.createdAt ? new Date(q.createdAt) : new Date();

    /** Pro-forma validity reference: stored value or createdAt + 7 days */
    const quoteValidUntil = q.validUntil
        ? new Date(q.validUntil)
        : addDays(created, 7);
    const quoteValidityStr = formatDateUSLong(quoteValidUntil);

    /** Invoice: due date = first acceptance/approval timestamp + 20 days */
    const approvalBase =
        q.clientAcceptedAt || q.managerApprovedAt || q.createdAt;
    const dueDate = addDays(new Date(approvalBase), 20);
    const paymentDueStr = formatDateUSLong(dueDate);

    const invoiceDateBase =
        q.clientAcceptedAt || q.managerApprovedAt || q.createdAt;
    const invoiceDate = new Date(invoiceDateBase);
    const dateStr = formatDateUSLong(invoiceDate);

    const idHex = String(q._id || '').replace(/[^a-f0-9]/gi, '');
    const idSuffix = (idHex.slice(-8) || '00000000').toUpperCase();
    const invoiceNumber = `INV-${yyyymmdd(invoiceDate)}-${idSuffix}`;

    const refQuoteNumber =
        q.quotationNumber || q.quotationId || String(q._id || '').slice(-8);

    return {
        clientName,
        fromHtml,
        statusLabel,
        routingFrom,
        routingTo,
        quotationId: q.quotationId || String(q._id || '').slice(-8),
        quotationNumber: q.quotationNumber || '',
        refQuoteNumber,
        invoiceNumber,
        dateStr,
        paymentDueStr,
        quoteValidityStr,
        revisionCount: q.revisionCount ?? 0,
        currencyCode: cur,
        mode: q.mode || '',
        serviceMode: q.serviceMode || '',
        hasModeExtras: !!(q.mode || q.serviceMode),
        items,
        hasItems: items.length > 0,
        isPendingReview,
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

module.exports = { buildInvoiceLedgerData, buildQuotationPdfData };
