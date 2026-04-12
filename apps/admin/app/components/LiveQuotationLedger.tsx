import React from 'react';
import { Quotation } from '../../types';

interface LiveQuotationLedgerProps {
    quotation: Quotation;
}

const CURRENCY_SYMBOL: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', AED: 'AED ', CNY: '¥', JPY: '¥', INR: '₹',
};

function buildFromLines(q: Quotation & { routingData?: any; fulfillmentDetails?: any }) {
    const rd = q.routingData || {};
    const fd = q.fulfillmentDetails || {};
    const parts = [
        rd.originWarehouseName,
        [rd.originWarehouseCity, rd.originWarehouseState].filter(Boolean).join(', '),
        fd.pickupAddressLine,
        fd.senderName ? `Attn: ${fd.senderName}` : null,
        fd.senderPhone ? `Tel: ${fd.senderPhone}` : null,
    ].filter(Boolean);
    return parts.length ? parts : null;
}

export const LiveQuotationLedger: React.FC<LiveQuotationLedgerProps> = ({ quotation }) => {
    const cur = quotation.currency || 'USD';
    const sym = CURRENCY_SYMBOL[cur] || '$';
    const q = quotation as Quotation & { routingData?: any; fulfillmentDetails?: any; shippingCharge?: number };

    const isPendingReview = quotation.status === 'PENDING_ADMIN_REVIEW' || quotation.status === 'DRAFT';

    const formatMoney = (val: number | undefined | null, fallback = '—') => {
        if (val === null || val === undefined) return fallback;
        if (Number(val) === 0) return fallback === 'Pending' ? fallback : `${sym}0.00`;
        return `${sym}${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString?: Date | string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    const itemsAmountSum = (quotation.items || []).reduce((s, it: any) => {
        const qty = Number(it.quantity) || 1;
        const up = Number(it.unitPrice) || 0;
        const amt = it.amount != null && it.amount !== '' ? Number(it.amount) : qty * up;
        return s + (Number.isFinite(amt) ? amt : qty * up);
    }, 0);
    const baseF = (quotation as any).pricing?.baseFreightCharge ?? quotation.baseFreightCharge ?? 0;
    const handl = (quotation as any).pricing?.estimatedHandlingFee ?? quotation.estimatedHandlingFee ?? 0;
    const subtotalNumeric = itemsAmountSum + Number(baseF || 0) + Number(handl || 0);
    const shippingNumeric =
        Number(q.shippingCharge || 0) +
        Number(quotation.firstMileCharge || 0) +
        Number(quotation.lastMileCharge || 0);

    const fromLines = buildFromLines(q);

    return (
        <div className="bg-white text-black p-8 max-w-4xl mx-auto border border-gray-300 shadow-sm font-sans">
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                    <h1 className="text-4xl font-bold tracking-wider text-blue-600 mb-2">QUOTATION</h1>
                    <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded mb-4 border border-gray-200">
                        {quotation.status?.replace(/_/g, ' ')}
                    </div>

                    {fromLines && (
                        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-gray-700">
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">From:</p>
                            <div className="space-y-0.5">
                                {fromLines.map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-1">TO:</h3>
                        <p className="font-semibold text-gray-800">{(quotation.clientId as any)?.fullName || 'Customer'}</p>
                        <p className="text-gray-600 text-sm">
                            {quotation.routingData?.sourceCity && (
                                <span>Route: <strong>{quotation.routingData.sourceCity}</strong>{quotation.routingData.sourceRegion ? `, ${quotation.routingData.sourceRegion}` : ''}</span>
                            )}
                            {quotation.routingData?.destinationCity && (
                                <span className="ml-4">→ <strong>{quotation.routingData.destinationCity}</strong>{quotation.routingData.destinationRegion ? `, ${quotation.routingData.destinationRegion}` : ''}</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-blue-700 m-0 leading-none">B&B</h2>
                        <h2 className="text-xl font-bold text-blue-700 m-0 leading-tight">INTERNATIONAL</h2>
                        <p className="text-xs text-blue-500 font-medium italic">Serving You Beyond Borders</p>
                    </div>

                    <div className="text-sm text-gray-700 space-y-1">
                        <p><span className="font-semibold">Quotation #:</span> {quotation.quotationId || (quotation.id || '').substring(0, 8)}</p>
                        <p><span className="font-semibold">Date:</span> {formatDate(quotation.createdAt)}</p>
                        <p><span className="font-semibold">Revision:</span> {quotation.revisionCount || 0}</p>
                        <p><span className="font-semibold">Currency:</span> {cur}</p>
                        {quotation.validUntil && <p><span className="font-semibold">Valid Until:</span> {formatDate(quotation.validUntil)}</p>}
                    </div>
                </div>
            </div>

            <table className="w-full text-sm border-collapse border border-gray-300 mb-8 table-fixed">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-gray-700 w-10">#</th>
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Item / Description</th>
                        <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-gray-700 w-24">Product Image</th>
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700 w-28">HS Code</th>
                        <th className="border border-gray-300 px-2 py-2 text-right font-semibold text-gray-700 w-24">Tax</th>
                        <th className="border border-gray-300 px-2 py-2 text-right font-semibold text-gray-700 w-28">Line Total</th>
                    </tr>
                </thead>
                <tbody>
                    {quotation.items?.map((item: any, index: number) => {
                        const qty = item.quantity || 1;
                        const up = Number(item.unitPrice) || 0;
                        const lt = Number(item.lineTax) || 0;
                        const lineBase = Number(item.amount) || qty * up;
                        const lineTotal = lineBase + lt;
                        const img = item.images?.[0] as string | undefined;

                        return (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-2 py-2 text-center text-gray-800 align-middle">{index + 1}</td>
                                <td className="border border-gray-300 px-2 py-2 text-gray-800 align-top">
                                    <div className="font-medium">{item.description}</div>
                                    {item.category && <div className="text-xs text-gray-500 mt-0.5 capitalize">{item.category}</div>}
                                    {item.isHazardous && <div className="text-xs text-red-600 mt-0.5">⚠ Hazardous</div>}
                                </td>
                                <td className="border border-gray-300 px-1 py-2 text-center align-middle">
                                    {img ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={img} alt="" className="mx-auto w-14 h-14 object-cover rounded border border-gray-200" />
                                    ) : (
                                        <div className="mx-auto w-14 h-14 bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-500">
                                            N/A
                                        </div>
                                    )}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-gray-800 align-middle text-xs">
                                    {item.hsCode || '—'}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-right text-gray-800 align-middle">
                                    {isPendingReview ? (
                                        <span className="text-orange-500 italic text-xs">Pending</span>
                                    ) : (
                                        formatMoney(lt, `${sym}0.00`)
                                    )}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-right text-gray-800 font-bold align-middle">
                                    {isPendingReview || (lineBase === 0 && lt === 0)
                                        ? <span className="text-orange-400 italic text-xs">Pending</span>
                                        : formatMoney(lineTotal, `${sym}0.00`)
                                    }
                                </td>
                            </tr>
                        );
                    })}
                    {(!quotation.items || quotation.items.length === 0) && (
                        <tr>
                            <td colSpan={6} className="border border-gray-300 px-3 py-6 text-center text-gray-500 italic">
                                No items available currently.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="flex justify-between items-start">
                <div className="w-1/2 pr-8 text-sm text-gray-600">
                    <p className="mb-2 font-semibold text-gray-800">Terms &amp; Conditions (Short Version)</p>
                    <div className="text-xs space-y-2 leading-relaxed">
                        <p><strong>Payment:</strong> 50% advance, balance 50% payable within 20 days from invoice/shipment date.</p>
                        <p><strong>Delivery:</strong> Timelines are approximate. Delays due to natural calamities, war, pandemic, port congestion, or customs/legal procedures are not our responsibility.</p>
                        <p><strong>Customer Information:</strong> Customer must provide accurate product details and documents. We are not liable for losses due to incorrect or incomplete information.</p>
                        <p><strong>Penalties:</strong> Any fines, penalties, or charges arising from wrong declaration will be borne by the customer.</p>
                        <p><strong>Certifications:</strong> Customer must provide all required certifications (e.g., CE, BIS, SABER/SABRE, etc.) as applicable.</p>
                        <p><strong>Packaging:</strong> Goods must be packed as per our instructions. We are not responsible for damage due to improper packaging.</p>
                        <p><strong>Customs Issues:</strong> Any delay, detention, or seizure due to documentation errors or non-compliance will be at customer’s risk and cost.</p>
                        <p><strong>Shipment Impact:</strong> If one customer’s cargo affects clearance of the full shipment/container, all related charges will be borne by that customer.</p>
                        <p><strong>Liability:</strong> Our liability is limited to service charges only. No responsibility for indirect or consequential losses.</p>
                        <p><strong>Acceptance:</strong> Payment or order confirmation implies acceptance of these terms.</p>
                    </div>
                    {quotation.additionalNotes && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs font-semibold text-amber-800 mb-1">📝 Admin Note:</p>
                            <p className="text-xs text-amber-700">{quotation.additionalNotes}</p>
                        </div>
                    )}
                </div>

                <div className="w-1/2">
                    <div className="bg-gray-50 p-4 border border-gray-200 flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between text-sm text-gray-700">
                            <span>Subtotal</span>
                            <span className="font-medium">{isPendingReview ? '—' : formatMoney(subtotalNumeric, `${sym}0.00`)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-700">
                            <span>Shipping Charge</span>
                            <span className="font-medium">{isPendingReview ? '—' : formatMoney(shippingNumeric, `${sym}0.00`)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-700">
                            <span>Tax</span>
                            <span className="font-medium">{isPendingReview ? '—' : formatMoney(quotation.tax, `${sym}0.00`)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-700">
                            <span>Discount</span>
                            <span className="font-medium">-{formatMoney(quotation.discount, `${sym}0.00`)}</span>
                        </div>

                        <div className="border-t border-gray-300 my-2"></div>

                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-800">
                                {isPendingReview ? 'Quote Pending' : 'Grand Total'}
                            </span>
                            <span className="text-xl font-bold text-blue-700">
                                {isPendingReview
                                    ? <span className="text-orange-500 text-base italic">Awaiting Admin Pricing</span>
                                    : formatMoney(quotation.totalAmount, `${sym}0.00`)
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-400">
                <p>This is a computer-generated document. No signature is required.</p>
                <p>B&B Logistics & Management Solutions</p>
            </div>
        </div>
    );
};

export default LiveQuotationLedger;
