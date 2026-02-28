'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LiveQuotationLedger from '../../../components/LiveQuotationLedger';
import { Quotation } from '../../../../types';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ItemPrice { unitPrice: number; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusLabel: Record<string, { text: string; color: string }> = {
    PENDING_ADMIN_REVIEW: { text: 'Pending Admin Review', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    PENDING_CUSTOMER_APPROVAL: { text: 'Sent — Awaiting Customer', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    AWAITING_FINAL_CHARGE_SHEET: { text: 'Customer Accepted — Finalize Charges', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    PAYMENT_PENDING: { text: 'Payment Pending', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    ACCEPTED: { text: 'Accepted', color: 'bg-green-100 text-green-800 border-green-200' },
    REJECTED: { text: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
    DRAFT: { text: 'Draft', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function StatusPill({ status }: { status: string }) {
    const s = statusLabel[status] ?? { text: status?.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-700 border-gray-200' };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
            {s.text}
        </span>
    );
}

function InputField({ label, prefix = '$', value, onChange, min = 0 }: {
    label: string; prefix?: string; value: number; onChange: (v: number) => void; min?: number;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">{prefix}</span>
                <input
                    type="number"
                    min={min}
                    step="0.01"
                    value={value || ''}
                    placeholder="0.00"
                    onChange={e => onChange(e.target.value ? Number(e.target.value) : 0)}
                    className="pl-8 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QuotationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Pricing state (PENDING_ADMIN_REVIEW)
    const [baseFreightCharge, setBaseFreightCharge] = useState(0);
    const [estimatedHandlingFee, setEstimatedHandlingFee] = useState(0);
    const [pricingNotes, setPricingNotes] = useState('');
    // keyed by item index — holds the admin-set SHIPPING CHARGE (not commercial value)
    const [itemPrices, setItemPrices] = useState<Record<number, { shippingCharge: number }>>({});

    // Final charges state (AWAITING_FINAL_CHARGE_SHEET)
    const [firstMileCharge, setFirstMileCharge] = useState(0);
    const [lastMileCharge, setLastMileCharge] = useState(0);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchQuotation = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/quotations/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuotation(data);
                // Pre-fill item prices if available
                if (data.items?.length) {
                    const prices: Record<number, { shippingCharge: number }> = {};
                    data.items.forEach((item: any, i: number) => {
                        // Pre-fill from saved shippingCharge (or legacy unitPrice)
                        prices[i] = { shippingCharge: item.shippingCharge || item.unitPrice || 0 };
                    });
                    setItemPrices(prices);
                }
                // Pre-fill charges if re-visiting
                setBaseFreightCharge(data.pricing?.baseFreightCharge || 0);
                setEstimatedHandlingFee(data.pricing?.estimatedHandlingFee || 0);
            } else {
                showToast('Failed to load quotation', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchQuotation(); }, [fetchQuotation]);

    // ── PENDING_ADMIN_REVIEW: Submit pricing → PENDING_CUSTOMER_APPROVAL ──
    const handlePriceQuotation = async () => {
        if (baseFreightCharge <= 0 && estimatedHandlingFee <= 0 && itemsTotal <= 0) {
            showToast('Please enter at least one charge before submitting.', 'error');
            return;
        }
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const updatedItems = quotation.items?.map((item: any, i: number) => ({
                description: item.description,
                quantity: item.quantity,
                weight: item.weight,
                category: item.category,
                isHazardous: item.isHazardous,
                // Preserve client commercial value — admin only sets shippingCharge
                declaredValue: item.declaredValue || 0,
                targetRate: item.targetRate || 0,
                shippingCharge: itemPrices[i]?.shippingCharge || 0,
                // Legacy mirrors
                unitPrice: itemPrices[i]?.shippingCharge || 0,
                amount: (itemPrices[i]?.shippingCharge || 0) * (item.quantity || 1),
            })) || [];

            const body = {
                baseFreightCharge: Number(baseFreightCharge),
                estimatedHandlingFee: Number(estimatedHandlingFee),
                items: updatedItems,
                pricingNotes: pricingNotes.trim(),
            };

            const res = await fetch(`/api/quotations/${id}/workflow/price`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showToast('✓ Priced quotation sent to customer for approval!');
                fetchQuotation();
            } else {
                const err = await res.json();
                showToast(err.message || 'Failed to submit pricing', 'error');
            }
        } catch {
            showToast('Network error while submitting', 'error');
        } finally {
            setSending(false);
        }
    };

    // ── AWAITING_FINAL_CHARGE_SHEET: Finalize → PAYMENT_PENDING ──────────
    const handleFinalizeChargeSheet = async () => {
        setSending(true);
        try {
            const res = await fetch(`/api/quotations/${id}/workflow/finalize-charges`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ firstMileCharge: Number(firstMileCharge), lastMileCharge: Number(lastMileCharge) }),
            });

            if (res.ok) {
                showToast('✓ Charge sheet finalized! Payment invoice has been issued.');
                fetchQuotation();
            } else {
                const err = await res.json();
                showToast(err.message || 'Failed to finalize charge sheet', 'error');
            }
        } catch {
            showToast('Network error while finalizing', 'error');
        } finally {
            setSending(false);
        }
    };

    // ── Loading / Error ────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading quotation...</p>
                </div>
            </div>
        );
    }
    if (!quotation) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 font-medium">Quotation not found.</p>
                <button onClick={() => router.push('/quotations')} className="mt-4 text-sm text-primary underline">← Back to list</button>
            </div>
        );
    }

    const rd = quotation.routingData;
    const fd = quotation.fulfillmentDetails;
    const currency = quotation.currency || 'USD';
    const currencySymbol = currency === 'AED' ? 'AED ' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    const itemsTotal = Object.values(itemPrices).reduce((sum, ip) => sum + ((ip as any).shippingCharge || 0), 0);
    const subtotal = Number(baseFreightCharge) + Number(estimatedHandlingFee) + itemsTotal;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {toast.msg}
                </div>
            )}

            {/* Page Header */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/quotations')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
                        >
                            ← Back
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-gray-900">
                                    {quotation.quotationId || `Quotation #${id.slice(-8).toUpperCase()}`}
                                </h1>
                                <StatusPill status={quotation.status} />
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Client: <span className="font-medium text-gray-700">{quotation.clientId?.fullName || 'N/A'}</span>
                                {quotation.clientId?.email && <span className="ml-2 text-gray-400">{quotation.clientId.email}</span>}
                            </p>
                        </div>
                    </div>
                    <button onClick={fetchQuotation} className="text-sm text-gray-500 hover:text-primary transition">↻ Refresh</button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

                {/* ── Routing / Request summary ─────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Shipment Request Overview</h2>
                    </div>
                    <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Origin</p>
                            <p className="font-semibold text-gray-800">{rd?.sourceCity || quotation.origin?.city || '—'}</p>
                            <p className="text-gray-500">{rd?.sourceRegion || quotation.origin?.country || ''}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Destination</p>
                            <p className="font-semibold text-gray-800">{rd?.destinationCity || quotation.destination?.city || '—'}</p>
                            <p className="text-gray-500">{rd?.destinationRegion || quotation.destination?.country || ''}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Service Mode</p>
                            <p className="font-semibold text-gray-800">{quotation.serviceMode || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Special Notes</p>
                            <p className="text-gray-600 text-xs">{quotation.specialInstructions || 'None'}</p>
                        </div>
                    </div>
                </div>

                {/* ── Items Table ────────────────────────────────────────────── */}
                {quotation.items?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Items ({quotation.items.length})
                            </h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs font-semibold text-gray-400 uppercase border-b border-gray-100">
                                    <th className="px-6 py-3 text-left">Description</th>
                                    <th className="px-6 py-3 text-center">Qty</th>
                                    <th className="px-6 py-3 text-center">Weight</th>
                                    <th className="px-6 py-3 text-center">Volume (CBM)</th>
                                    <th className="px-6 py-3 text-center">Category</th>
                                    <th className="px-6 py-3 text-right">Target Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {quotation.items.map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-800">
                                            {item.description}
                                            {item.isHazardous && (
                                                <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">⚠ Hazardous</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-center text-gray-600">{item.quantity}</td>
                                        <td className="px-6 py-3 text-center text-gray-600">{item.weight ? `${item.weight} kg` : '—'}</td>
                                        <td className="px-6 py-3 text-center text-gray-600">{item.packingVolume ? `${item.packingVolume} CBM` : '—'}</td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 text-xs">{item.category || 'General'}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right text-gray-500">
                                            {item.targetRate ? `${item.targetCurrency || 'USD'} ${item.targetRate}` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Fulfillment Details (shown when customer has accepted) ─── */}
                {fd && (
                    <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-purple-100 bg-purple-50">
                            <h2 className="text-sm font-semibold text-purple-800 uppercase tracking-wide">✓ Customer Fulfillment Details</h2>
                        </div>
                        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">
                                    Origin ({fd.pickupType === 'WAREHOUSE_DROP' ? '🏭 Warehouse Drop-Off' : '🏠 Home/Office Pickup'})
                                </p>
                                <p className="font-semibold text-gray-800">{fd.senderName}</p>
                                <p className="text-gray-500">{fd.senderPhone}</p>
                                {fd.pickupAddressLine && <p className="text-gray-600 mt-1">{fd.pickupAddressLine}</p>}
                                <p className="text-gray-600">{[fd.pickupCity, fd.pickupState, fd.pickupCountry].filter(Boolean).join(', ')}</p>
                                {fd.pickupZip && <p className="text-gray-400 text-xs">{fd.pickupZip}</p>}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">
                                    Destination ({fd.deliveryType === 'WAREHOUSE_PICKUP' ? '🏭 Warehouse Pickup' : '🚚 Home Delivery'})
                                </p>
                                <p className="font-semibold text-gray-800">{fd.recipientName}</p>
                                <p className="text-gray-500">{fd.recipientPhone}</p>
                                {fd.deliveryAddressLine && <p className="text-gray-600 mt-1">{fd.deliveryAddressLine}</p>}
                                <p className="text-gray-600">{[fd.deliveryCity, fd.deliveryState, fd.deliveryCountry].filter(Boolean).join(', ')}</p>
                                {fd.deliveryZip && <p className="text-gray-400 text-xs">{fd.deliveryZip}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── LIVE LEDGER ─────────────────────────────────────────────── */}
                <LiveQuotationLedger quotation={quotation as Quotation} />

                {/* ═══════════════════════════════════════════════════════════════
                    ACTION PANELS — rendered per status
                ═══════════════════════════════════════════════════════════════ */}

                {/* ── PANEL 1: Admin Pricing (PENDING_ADMIN_REVIEW) ─────────── */}
                {quotation.status === 'PENDING_ADMIN_REVIEW' && (
                    <div className="bg-white rounded-xl border-2 border-amber-300 shadow-lg overflow-hidden">
                        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
                            <span className="text-2xl">⚡</span>
                            <div>
                                <h2 className="text-base font-bold text-amber-900">Admin Action Required: Price This Quotation</h2>
                                <p className="text-xs text-amber-700">Enter your pricing below and submit to send to the customer for approval.</p>
                            </div>
                        </div>

                        <div className="px-6 py-6 space-y-6">
                            {/* Core charges */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Core Transport Charges</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField
                                        label="Base Freight Charge"
                                        value={baseFreightCharge}
                                        onChange={setBaseFreightCharge}
                                    />
                                    <InputField
                                        label="Estimated Handling Fee"
                                        value={estimatedHandlingFee}
                                        onChange={setEstimatedHandlingFee}
                                    />
                                </div>
                            </div>

                            {/* Per-item shipping charges */}
                            {quotation.items?.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                        Itemized Shipping Charges
                                    </h3>
                                    <p className="text-xs text-gray-400 mb-3">
                                        Enter the <strong>freight/shipping cost</strong> for each item. The client's declared commercial value is shown as read-only context.
                                    </p>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Item</th>
                                                    <th className="px-4 py-3 text-center">Qty</th>
                                                    <th className="px-4 py-3 text-right text-blue-600">Client Declared Value</th>
                                                    <th className="px-4 py-3 text-right text-blue-400">Target Rate</th>
                                                    <th className="px-4 py-3 text-right w-40 text-amber-700">Shipping Charge ↓ Set This</th>
                                                    <th className="px-4 py-3 text-right w-32">Line Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {quotation.items.map((item: any, i: number) => {
                                                    const sc = itemPrices[i]?.shippingCharge || 0;
                                                    const lineTotal = sc * (item.quantity || 1);
                                                    const cur = quotation.currency || 'USD';
                                                    return (
                                                        <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="font-medium text-gray-800">
                                                                    {item.description}
                                                                    {item.isHazardous && <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">⚠ Hazardous</span>}
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-0.5">{item.category} · {item.weight ? `${item.weight} kg` : '—'}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-gray-600 font-medium">{item.quantity}</td>
                                                            {/* Read-only: client's commercial value */}
                                                            <td className="px-4 py-3 text-right">
                                                                <span className="text-blue-700 font-medium">
                                                                    {item.declaredValue ? `${cur} ${Number(item.declaredValue).toFixed(2)}` : '—'}
                                                                </span>
                                                            </td>
                                                            {/* Read-only: client's target rate */}
                                                            <td className="px-4 py-3 text-right">
                                                                <span className="text-gray-400 text-xs">
                                                                    {item.targetRate ? `${cur} ${Number(item.targetRate).toFixed(2)}` : '—'}
                                                                </span>
                                                            </td>
                                                            {/* Admin-set: shipping charge */}
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <span className="text-gray-400 text-xs">{currencySymbol}</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        value={sc || ''}
                                                                        onChange={e => setItemPrices(prev => ({
                                                                            ...prev,
                                                                            [i]: { shippingCharge: e.target.value ? Number(e.target.value) : 0 }
                                                                        }))}
                                                                        className="w-28 text-right border-2 border-amber-300 rounded-lg px-2 py-1.5 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 font-semibold"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-semibold text-gray-800">
                                                                {lineTotal > 0 ? `${currencySymbol}${lineTotal.toFixed(2)}` : '—'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-amber-50 border-t border-amber-200">
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-2 text-right text-xs font-bold text-amber-800">Itemized Shipping Subtotal</td>
                                                    <td className="px-4 py-2 text-right font-bold text-amber-900">{currencySymbol}{itemsTotal.toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Admin notes */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Pricing Notes for Customer (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={pricingNotes}
                                    onChange={e => setPricingNotes(e.target.value)}
                                    placeholder="Explain the pricing breakdown, validity period, included services, etc."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                                />
                            </div>

                            {/* Live Total Preview */}
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">Quote Summary ({currency})</p>
                                <div className="flex justify-between text-sm mb-1 text-gray-600">
                                    <span>Base Freight Charge</span>
                                    <span className="font-medium">{currencySymbol}{Number(baseFreightCharge).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-1 text-gray-600">
                                    <span>Handling Fee</span>
                                    <span className="font-medium">{currencySymbol}{Number(estimatedHandlingFee).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2 text-gray-600">
                                    <span>Itemized Shipping ({quotation.items?.length || 0} items)</span>
                                    <span className="font-medium">{currencySymbol}{itemsTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t border-blue-200 pt-2">
                                    <span className="text-blue-900">Estimated Grand Total</span>
                                    <span className="text-blue-700">{currencySymbol}{subtotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handlePriceQuotation}
                                    disabled={sending}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-60 flex items-center gap-2"
                                >
                                    {sending ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        '✉ Submit Pricing to Customer'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PANEL 2: Waiting for Customer (PENDING_CUSTOMER_APPROVAL) ─ */}
                {quotation.status === 'PENDING_CUSTOMER_APPROVAL' && (
                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl flex items-start gap-4 shadow-sm">
                        <div className="text-blue-500 text-3xl mt-0.5">⏳</div>
                        <div>
                            <h3 className="text-base font-bold text-blue-900">Waiting for Customer Decision</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Your priced quotation has been sent. The customer is reviewing and will either
                                <strong> Accept</strong> (providing fulfillment addresses) or
                                <strong> Revise</strong> (seeking re-pricing).
                            </p>
                            <p className="text-xs text-blue-500 mt-2">This quotation is locked from admin edits until the customer responds.</p>
                        </div>
                    </div>
                )}

                {/* ── PANEL 3: Finalize Charge Sheet (AWAITING_FINAL_CHARGE_SHEET) ─ */}
                {quotation.status === 'AWAITING_FINAL_CHARGE_SHEET' && (
                    <div className="bg-white rounded-xl border-2 border-purple-300 shadow-lg overflow-hidden">
                        <div className="px-6 py-4 bg-purple-50 border-b border-purple-200 flex items-center gap-3">
                            <span className="text-2xl">📋</span>
                            <div>
                                <h2 className="text-base font-bold text-purple-900">Finalize Charge Sheet</h2>
                                <p className="text-xs text-purple-700">Customer has accepted. Add first & last mile charges to finalize.</p>
                            </div>
                        </div>
                        <div className="px-6 py-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField
                                    label="First Mile Charge (Origin Pickup / Drop-Off)"
                                    value={firstMileCharge}
                                    onChange={setFirstMileCharge}
                                />
                                <InputField
                                    label="Last Mile Charge (Destination Delivery / Warehouse)"
                                    value={lastMileCharge}
                                    onChange={setLastMileCharge}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleFinalizeChargeSheet}
                                    disabled={sending}
                                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-60 flex items-center gap-2"
                                >
                                    {sending ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Finalizing...
                                        </>
                                    ) : (
                                        '✓ Finalize & Issue Payment Invoice'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PANEL 4: Payment Pending ──────────────────────────────── */}
                {quotation.status === 'PAYMENT_PENDING' && (
                    <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl flex items-start gap-4">
                        <span className="text-3xl">💳</span>
                        <div>
                            <h3 className="text-base font-bold text-orange-900">Awaiting Payment</h3>
                            <p className="text-sm text-orange-700 mt-1">The charge sheet has been finalized and a payment invoice has been issued to the customer.</p>
                        </div>
                    </div>
                )}

                {/* ── PANEL 5: Completed ────────────────────────────────────── */}
                {(quotation.status === 'ACCEPTED' || quotation.status === 'CONVERTED_TO_SHIPMENT') && (
                    <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-start gap-4">
                        <span className="text-3xl">✅</span>
                        <div>
                            <h3 className="text-base font-bold text-green-900">Quotation Complete</h3>
                            <p className="text-sm text-green-700 mt-1">This quotation has been accepted and converted into an active shipment.</p>
                        </div>
                    </div>
                )}

                {/* ── PANEL 6: Rejected ─────────────────────────────────────── */}
                {quotation.status === 'REJECTED' && (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex items-start gap-4">
                        <span className="text-3xl">❌</span>
                        <div>
                            <h3 className="text-base font-bold text-red-900">Quotation Rejected</h3>
                            <p className="text-sm text-red-700 mt-1">The customer has rejected this quotation.</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
