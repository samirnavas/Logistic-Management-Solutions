/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LiveQuotationLedger from '../../../components/LiveQuotationLedger';
import { Quotation } from '../../../../types';
import {
    MapPin, Package, StickyNote, ArrowRight, IndianRupee,
    AlertTriangle, Loader2, CheckCircle2, Clock, Check, RefreshCw, ChevronLeft,
    Sparkles, ChevronDown, ChevronUp, Plane, Ship
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusLabel: Record<string, { text: string; color: string }> = {
    PENDING_ADMIN_REVIEW: { text: 'Pending Admin Review', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    PENDING_CUSTOMER_APPROVAL: { text: 'Sent — Awaiting Customer', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    AWAITING_FINAL_CHARGE_SHEET: { text: 'Customer Accepted — Finalize Charges', color: 'bg-slate-100 text-purple-800 border-purple-200' },
    PAYMENT_PENDING: { text: 'Payment Pending', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    ACCEPTED: { text: 'Accepted', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    REJECTED: { text: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
    DRAFT: { text: 'Draft', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function StatusPill({ status }: { status: string }) {
    const s = statusLabel[status] ?? { text: status?.replace(/_/g, ' '), color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
            {s.text}
        </span>
    );
}

/** Parse form charge input; invalid values become 0 so PATCH never sends NaN. */
function parseNonNegativeCharge(raw: number | string): number {
    if (raw === '' || raw === null || raw === undefined) return 0;
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).trim());
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
}

function InputField({ label, prefix, value, onChange, min = 0, disabled = false }: {
    label: string; prefix?: string; value: number | string; onChange: (v: number | string) => void; min?: number; disabled?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">{label}</label>
            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                        {prefix}
                    </span>
                )}
                <input
                    type="number"
                    min={min}
                    step="0.01"
                    value={value}
                    placeholder="0.00"
                    disabled={disabled}
                    onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full border border-slate-300 rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${prefix ? 'pl-9 pr-3' : 'px-3'}`}
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
    const [baseFreightCharge, setBaseFreightCharge] = useState<number | string>('');
    const [estimatedHandlingFee, setEstimatedHandlingFee] = useState<number | string>('');
    const [pricingNotes, setPricingNotes] = useState('');
    // keyed by item index
    const [itemPrices, setItemPrices] = useState<Record<number, { shippingCharge: number }>>({});

    // Final charges state (AWAITING_FINAL_CHARGE_SHEET)
    const [firstMileCharge, setFirstMileCharge] = useState<number | string>('');
    const [lastMileCharge, setLastMileCharge] = useState<number | string>('');

    // ── Automated Pricing Engine ─────────────────────────────────
    const [transportMode, setTransportMode] = useState<'Air' | 'Sea'>('Air');
    const [isCalculating, setIsCalculating] = useState(false);
    const [estimateReceipt, setEstimateReceipt] = useState<any>(null);
    const [showBreakdown, setShowBreakdown] = useState(false);

    const finalizeInFlight = useRef(false);

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

                // Pre-fill items pricing mapping
                if (data.items?.length) {
                    const prices: Record<number, { shippingCharge: number }> = {};
                    data.items.forEach((item: any, i: number) => {
                        prices[i] = { shippingCharge: item.shippingCharge || item.unitPrice || 0 };
                    });
                    setItemPrices(prices);
                }

                // Pre-fill form state for pending review edits
                setBaseFreightCharge(data.pricing?.baseFreightCharge ?? data.baseFreightCharge ?? '');
                setEstimatedHandlingFee(data.pricing?.estimatedHandlingFee ?? data.estimatedHandlingFee ?? '');

            } else {
                showToast('Failed to load quotation', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const handleDownloadInvoice = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/quotations/${id}/invoice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                showToast('Failed to download invoice', 'error');
                return;
            }
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quotation-invoice-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showToast('✓ Invoice PDF downloaded');
        } catch (error) {
            showToast('Network error while downloading PDF', 'error');
        }
    };

    useEffect(() => { fetchQuotation(); }, [fetchQuotation]);

    useEffect(() => {
        if (quotation?.status !== 'AWAITING_FINAL_CHARGE_SHEET') return;
        const f = quotation.fulfillmentDetails;
        if (f?.pickupType === 'WAREHOUSE_DROP') setFirstMileCharge(0);
        if (f?.deliveryType === 'WAREHOUSE_PICKUP') setLastMileCharge(0);
    }, [quotation?.status, quotation?.fulfillmentDetails?.pickupType, quotation?.fulfillmentDetails?.deliveryType, quotation?._id]);

    // ── Auto-Estimate via Pricing Engine ────────────────────────
    const handleGenerateEstimate = useCallback(async () => {
        setIsCalculating(true);
        setEstimateReceipt(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/pricing-config/calculate/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ transportMode }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                showToast(data.message || 'Pricing engine failed. Check that items have weight/dimensions.', 'error');
                return;
            }

            const receipt = data.data;
            setEstimateReceipt(receipt);
            setShowBreakdown(true);

            // ── Pre-fill the form with calculated values ──────────
            // Standard fees become the base freight + handling fields
            const totalBaseFreight = receipt.breakdown.subtotals.baseFreight;
            const handlingFee = receipt.breakdown.standardFees.customsClearance
                + receipt.breakdown.standardFees.handlingFee;

            setBaseFreightCharge(parseFloat(totalBaseFreight.toFixed(2)));
            setEstimatedHandlingFee(parseFloat(handlingFee.toFixed(2)));

            // Per-item: apply each item's lineTotal as its shippingCharge
            if (receipt.breakdown.items?.length) {
                const newPrices: Record<number, { shippingCharge: number }> = {};
                receipt.breakdown.items.forEach((ri: any, i: number) => {
                    newPrices[i] = { shippingCharge: parseFloat(ri.lineTotal.toFixed(2)) };
                });
                setItemPrices(newPrices);
            }

            showToast('✓ Estimate generated! Review the breakdown and adjust before submitting.');
        } catch {
            showToast('Network error while running the pricing engine.', 'error');
        } finally {
            setIsCalculating(false);
        }
    }, [id, transportMode]);

    const handlePriceQuotation = async () => {
        if (Number(baseFreightCharge) <= 0 && Number(estimatedHandlingFee) <= 0 && itemsTotal <= 0) {
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
                // Preserve client commercial value
                declaredValue: item.value || item.declaredValue || 0,
                targetRate: item.targetRate || 0,
                shippingCharge: itemPrices[i]?.shippingCharge || 0,
                // Legacy fields
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

    const handleFinalizeChargeSheet = async () => {
        if (finalizeInFlight.current || sending) return;
        finalizeInFlight.current = true;
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const fd = quotation?.fulfillmentDetails;
            let first = parseNonNegativeCharge(firstMileCharge);
            let last = parseNonNegativeCharge(lastMileCharge);

            // Match server business rules: warehouse drop/pickup forbids that leg’s mile charge.
            if (fd?.pickupType === 'WAREHOUSE_DROP') {
                if (first > 0) setFirstMileCharge(0);
                first = 0;
            }
            if (fd?.deliveryType === 'WAREHOUSE_PICKUP') {
                if (last > 0) setLastMileCharge(0);
                last = 0;
            }

            const res = await fetch(`/api/quotations/${id}/workflow/finalize-charges`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    firstMileCharge: first,
                    lastMileCharge: last
                }),
            });

            if (res.ok) {
                showToast('✓ Charge sheet finalized! Payment invoice has been issued.');
                fetchQuotation();
            } else {
                let detail = 'Failed to finalize charge sheet';
                try {
                    const err = await res.json();
                    detail = [err.message, err.error].filter(Boolean).join(' — ') || detail;
                    if (err.currentStatus) {
                        fetchQuotation();
                    }
                } catch {
                    detail = res.statusText || detail;
                }
                showToast(detail, 'error');
            }
        } catch {
            showToast('Network error while finalizing', 'error');
        } finally {
            setSending(false);
            finalizeInFlight.current = false;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-transparent">
                <Loader2 className="w-10 h-10 text-slate-600 animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-500">Loading quotation profile...</p>
            </div>
        );
    }

    if (!quotation) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-transparent p-6">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-semibold mb-2">Quotation not found or unable to load data.</p>
                    <button onClick={() => router.push('/quotations')} className="flex items-center gap-2 mx-auto mt-6 text-sm text-slate-600 hover:text-blue-800 font-medium transition">
                        <ChevronLeft className="w-4 h-4" /> Return to Quotations
                    </button>
                </div>
            </div>
        );
    }

    // Unpack data mappings safely
    const rd = quotation.routingData;
    const fd = quotation.fulfillmentDetails;

    // Dynamic Custom Currency Mapping
    const currency = quotation.currency || 'USD';
    const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', AED: 'AED ', CNY: '¥', JPY: '¥', INR: '₹' };
    const currencySymbol = CURRENCY_SYMBOL[currency] || `${currency} `;

    // Derived values
    const itemsTotal = Object.values(itemPrices).reduce((sum, ip) => sum + ((ip as any).shippingCharge || 0), 0);
    const subtotal = Number(baseFreightCharge || 0) + Number(estimatedHandlingFee || 0) + itemsTotal;
    const isPostAcceptance = ['AWAITING_FINAL_CHARGE_SHEET', 'PAYMENT_PENDING', 'ACCEPTED', 'CONVERTED_TO_SHIPMENT'].includes(quotation.status);

    // Helpers
    const formatPending = (val: any) => val ? <span className="text-slate-900 font-medium">{val}</span> : <span className="text-slate-400 italic">Pending</span>;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">

            {/* Elegant Toast Feedback */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-md shadow-lg border text-sm font-medium transition-all flex items-center gap-2  ${toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-700 shadow-emerald-500/10' : 'bg-red-600 border-red-700 text-white'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5" />}
                    {toast.msg}
                </div>
            )}

            {/* Page Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 rounded-md shadow-sm mx-6 mt-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/quotations')}
                            className="p-2.5 hover:bg-slate-100 rounded-full transition text-slate-500"
                            title="Back"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                    {quotation.quotationId || `Quote #${id.slice(-8).toUpperCase()}`}
                                </h1>
                                <StatusPill status={quotation.status} />
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Ordered by: <span className="font-semibold text-slate-700">{quotation.clientId?.fullName || 'Client Not Assigned'}</span>
                                {quotation.clientId?.email && <span className="ml-1 opacity-80">— {quotation.clientId.email}</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isPostAcceptance || quotation.status === 'PENDING_CUSTOMER_APPROVAL' ? (
                            <button
                                onClick={handleDownloadInvoice}
                                className="flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg shadow-sm hover:shadow hover:bg-blue-100 active:scale-95 transition"
                            >
                                <StickyNote className="w-4 h-4" /> Export PDF
                            </button>
                        ) : null}
                        <button
                            onClick={fetchQuotation}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-600 transition bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:shadow active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* Vertical Architecture */}
                <div className="flex flex-col gap-8">

                    {/* ── Shipment Request Overview ── */}
                    <div className="space-y-6">

                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Shipment Request Overview</h2>
                        </div>

                        {/* Card 1: Routing & Fulfillment Mapping */}
                        <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-row items-center gap-3">
                                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg"><MapPin className="w-5 h-5" /></div>
                                <h3 className="font-semibold text-slate-800 text-sm tracking-wide">ROUTING LOGISTICS</h3>
                            </div>
                            <div className="p-6">
                                {/* Visual Route Timeline */}
                                <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-2 gap-6 md:gap-4">
                                    {/* Origin Hub */}
                                    <div className="text-center md:text-left w-full md:w-1/3">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Origin</p>
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tight truncate" title={rd?.originWarehouseCity || rd?.sourceCity || quotation.origin?.city}>
                                            {formatPending(rd?.originWarehouseCity || rd?.sourceCity || quotation.origin?.city)}
                                        </h4>
                                        <p className="text-sm font-semibold text-slate-500 truncate mt-0.5">
                                            {formatPending(rd?.originWarehouseState || rd?.sourceRegion || quotation.origin?.country)}
                                        </p>
                                        <div className="inline-block mt-3 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-[11px] font-bold border border-slate-200">
                                            WH: {formatPending(rd?.originWarehouseName)}
                                        </div>
                                    </div>
                                    
                                    {/* Connection Line */}
                                    <div className="flex-1 flex flex-col items-center w-full md:px-6 relative group">
                                        <div className="flex items-center w-full relative">
                                            <div className="w-2 h-2 rounded-full bg-slate-300 z-10 transition-colors group-hover:bg-slate-400"></div>
                                            <div className="flex-1 h-0 border-t-2 border-dashed border-slate-300 transition-colors group-hover:border-slate-400"></div>
                                            <div className="mx-3 p-2.5 bg-white rounded-full border-2 border-slate-200 text-slate-500 shadow-sm relative z-10 transition-all group-hover:border-slate-300 group-hover:scale-105">
                                                {(quotation.mode?.toLowerCase() === 'sea' || quotation.serviceMode?.toLowerCase().includes('sea') || quotation.serviceType?.toLowerCase().includes('sea') || transportMode === 'Sea')
                                                    ? <Ship className="w-5 h-5 text-slate-700" />
                                                    : <Plane className="w-5 h-5 text-slate-700" />
                                                }
                                            </div>
                                            <div className="flex-1 h-0 border-t-2 border-dashed border-slate-300 transition-colors group-hover:border-slate-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-slate-300 z-10 transition-colors group-hover:bg-slate-400"></div>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-3 tracking-widest bg-white px-2">
                                            {quotation.mode || quotation.serviceType || 'Transit Route'}
                                        </p>
                                    </div>

                                    {/* Destination Hub */}
                                    <div className="text-center md:text-right w-full md:w-1/3">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Destination</p>
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tight truncate" title={rd?.destinationWarehouseCity || rd?.destinationCity || quotation.destination?.city}>
                                            {formatPending(rd?.destinationWarehouseCity || rd?.destinationCity || quotation.destination?.city)}
                                        </h4>
                                        <p className="text-sm font-semibold text-slate-500 truncate mt-0.5">
                                            {formatPending(rd?.destinationWarehouseState || rd?.destinationRegion || quotation.destination?.country)}
                                        </p>
                                        <div className="inline-block mt-3 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-[11px] font-bold border border-slate-200">
                                            WH: {formatPending(rd?.destinationWarehouseName)}
                                        </div>
                                    </div>
                                </div>

                                {/* Progressive Disclosure of Specific Address */}
                                {isPostAcceptance && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-6 mt-2">
                                        {/* Pickup Details */}
                                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative overflow-hidden transition-colors hover:bg-slate-100/50">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                               <MapPin className="w-3 h-3"/> Confirmed Pickup Details
                                            </p>
                                            <p className="text-sm text-slate-800 font-semibold leading-relaxed mt-1">
                                                {fd?.pickupType === 'WAREHOUSE_DROP'
                                                    ? `${rd?.originWarehouseName || 'Origin facility'} (Warehouse Drop-off)`
                                                    : formatPending(fd?.pickupAddressLine || fd?.pickupAddress)}
                                            </p>
                                            {fd?.senderName && (
                                                <p className="text-xs text-slate-500 mt-3 font-medium border-t border-slate-200/60 pt-3">
                                                    Contact: <span className="text-slate-800 font-semibold">{fd.senderName}</span> 
                                                    {fd.senderPhone && <span className="text-slate-500"> — {fd.senderPhone}</span>}
                                                </p>
                                            )}
                                        </div>

                                        {/* Delivery Details */}
                                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative overflow-hidden transition-colors hover:bg-slate-100/50">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                               <MapPin className="w-3 h-3"/> Confirmed Delivery Details
                                            </p>
                                            <p className="text-sm text-slate-800 font-semibold leading-relaxed mt-1">
                                                {fd?.deliveryType === 'WAREHOUSE_PICKUP'
                                                    ? `${rd?.destinationWarehouseName || 'Destination facility'} (Warehouse Pickup)`
                                                    : formatPending(fd?.deliveryAddressLine || fd?.deliveryAddress)}
                                            </p>
                                            {fd?.recipientName && (
                                                <p className="text-xs text-slate-500 mt-3 font-medium border-t border-slate-200/60 pt-3">
                                                    Contact: <span className="text-slate-800 font-semibold">{fd.recipientName}</span> 
                                                    {fd.recipientPhone && <span className="text-slate-500"> — {fd.recipientPhone}</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card 2: Package/Item Specification Table */}
                        <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-row items-center gap-3">
                                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg"><Package className="w-5 h-5" /></div>
                                <h3 className="font-semibold text-slate-800 text-sm tracking-wide">CARGO / ITEMS INVENTORY</h3>
                                <div className="ml-auto flex items-center text-[11px] font-bold bg-white border border-slate-200 text-slate-600 py-1 shadow-sm px-2.5 rounded-full">
                                    {quotation.items?.length || 0} TOTAL ITEMS
                                </div>
                            </div>

                            {quotation.items && quotation.items.length > 0 ? (
                                <div className="overflow-x-auto p-1">
                                    <table className="w-full text-sm text-left align-middle whitespace-nowrap">
                                        <thead className="text-xs text-slate-400 uppercase font-bold border-b-2 border-slate-100">
                                            <tr>
                                                <th className="px-5 py-4 min-w-[200px]">Description & Type</th>
                                                <th className="px-5 py-4 text-center">Qty</th>
                                                <th className="px-5 py-4 text-center">Weight</th>
                                                <th className="px-5 py-4 text-center">CBM</th>
                                                <th className="px-5 py-4 text-right min-w-[140px]">Declared Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-600">
                                            {quotation.items.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition group">
                                                    <td className="px-5 py-4">
                                                        <div className="font-semibold text-slate-900 truncate max-w-[240px] whitespace-normal group-hover:text-slate-700 transition-colors">
                                                            {formatPending(item.description)}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 uppercase px-2 py-0.5 rounded border border-slate-200">
                                                                {item.category || 'General Cargo'}
                                                            </span>
                                                            {item.isHazardous && (
                                                                <span className="text-[10px] text-red-700 bg-red-100/50 uppercase px-2 py-0.5 rounded border border-red-200 font-bold flex items-center gap-1">
                                                                    <AlertTriangle className="w-3 h-3" /> Hazmat
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-center font-bold text-slate-800">{formatPending(item.quantity)}</td>
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="text-xs">{item.weight ? <><span className="font-semibold text-slate-800">{item.weight}</span> kg</> : formatPending(null)}</div>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="text-xs text-slate-500">{item.packingVolume ? <><span className="font-medium text-slate-700">{item.packingVolume}</span> CBM</> : '— CBM'}</div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        {(item.value || item.declaredValue) ? (
                                                            <div className="inline-flex items-center bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-slate-200">
                                                                {currencySymbol}{Number(item.value || item.declaredValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                        ) : formatPending(null)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400 flex flex-col justify-center items-center gap-3">
                                    <Package className="w-10 h-10 opacity-20" />
                                    <span className="text-sm font-medium">No particular cargo specified.</span>
                                </div>
                            )}
                        </div>

                        {/* Card 3: Additional Notes / Metadata */}
                        <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-row items-center gap-3">
                                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg"><StickyNote className="w-5 h-5" /></div>
                                <h3 className="font-semibold text-slate-800 text-sm tracking-wide">ADDITIONAL INSTRUCTIONS</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">Cargo Type</p>
                                    <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-md border border-slate-100 capitalize">{formatPending(quotation.cargoType || 'General Cargo')}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">Handling Instructions</p>
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200 font-medium">
                                        {quotation.specialInstructions ? quotation.specialInstructions : <span className="opacity-60 italic">No special instructions provided.</span>}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── Action Center ── */}
                    <div className="space-y-6">

                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Action Center</h2>
                        </div>

                        {/* Ledger */}
                        <LiveQuotationLedger quotation={quotation as Quotation} />

                        {/* ── Action Panel: PENDING_ADMIN_REVIEW ────────── */}
                        {quotation.status === 'PENDING_ADMIN_REVIEW' && (
                            <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-row items-center gap-3">
                                    <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg"><IndianRupee className="w-5 h-5" /></div>
                                    <h3 className="font-semibold text-slate-800 text-sm tracking-wide">DEFINE QUOTE PRICING</h3>
                                    <div className="ml-auto flex items-center text-[11px] font-bold bg-white border border-slate-200 text-slate-600 py-1 shadow-sm px-2.5 rounded-full">
                                        REV #{quotation.revisionCount ?? 0}
                                    </div>
                                </div>

                                {/* ── Auto-Estimate Strip ───────────────────────── */}
                                <div className="p-6 border-b border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Auto-Estimate Framework
                                    </p>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                        {/* Transport Mode Toggle */}
                                        <div className="flex rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white">
                                            <button
                                                onClick={() => setTransportMode('Air')}
                                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all ${transportMode === 'Air'
                                                    ? 'bg-blue-50 text-slate-700'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Plane className="w-4 h-4" /> Air
                                            </button>
                                            <button
                                                onClick={() => setTransportMode('Sea')}
                                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all border-l border-slate-200 ${transportMode === 'Sea'
                                                    ? 'bg-blue-50 text-slate-700'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Ship className="w-4 h-4" /> Sea
                                            </button>
                                        </div>

                                        {/* Generate Button */}
                                        <button
                                            onClick={handleGenerateEstimate}
                                            disabled={isCalculating}
                                            className="px-6 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-700 hover:bg-blue-50 active:scale-[0.98] text-slate-700 text-sm font-bold rounded-lg transition-all shadow-sm disabled:opacity-60 disabled:pointer-events-none flex items-center gap-2"
                                        >
                                            {isCalculating ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</>
                                            ) : (
                                                <><Sparkles className="w-4 h-4" /> Generate Pre-fill Estimate</>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* ── Estimate Breakdown Panel ───────────────── */}
                                {estimateReceipt && (
                                    <div className="border-b border-slate-100 bg-slate-50">
                                        <button
                                            onClick={() => setShowBreakdown(v => !v)}
                                            className="w-full flex items-center justify-between px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-slate-600" />
                                                Computed Preview: {estimateReceipt.transportMode} · {estimateReceipt.deliveryMode?.replace(/_/g, '-')}
                                            </span>
                                            <span className="flex items-center gap-3">
                                                <span className="text-slate-900 font-mono text-base">{currencySymbol}{estimateReceipt.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                {showBreakdown ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                            </span>
                                        </button>

                                        {showBreakdown && (
                                            <div className="px-6 pb-6 space-y-4">

                                                {/* Per-item rows */}
                                                {estimateReceipt.breakdown?.items?.map((ri: any, idx: number) => (
                                                    <div key={idx} className="bg-white rounded-lg border border-slate-200 p-4 text-sm shadow-sm">
                                                        <div className="flex justify-between font-bold text-slate-800 mb-3">
                                                            <span className="truncate pr-4">{ri.description}</span>
                                                            <span className="text-slate-900 shrink-0">{currencySymbol}{ri.lineTotal.toFixed(2)}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                                                            <div className="flex justify-between"><span>Qty</span><span className="font-medium text-slate-700">{ri.quantity}</span></div>
                                                            <div className="flex justify-between"><span>Weight</span><span className="font-medium text-slate-700">{ri.totalWeightKg} kg</span></div>
                                                            <div className="flex justify-between"><span>CBM</span><span className="font-medium text-slate-700">{ri.cbm}</span></div>
                                                            <div className="flex justify-between"><span>Base Freight</span><span className="font-medium text-slate-700">{currencySymbol}{ri.baseFreightCharge.toFixed(2)}</span></div>
                                                            <div className="flex justify-between col-span-2">
                                                                <span>Category Surcharge ({ri.categorySurcharge.category} · {ri.categorySurcharge.type === 'percentage' ? `${ri.categorySurcharge.rate}%` : `${currencySymbol}${ri.categorySurcharge.rate}`})</span>
                                                                <span className="font-medium text-slate-700">+{currencySymbol}{ri.categorySurcharge.amount.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Delivery + Fees summary */}
                                                <div className="bg-white rounded-lg border border-slate-200 p-4 text-sm shadow-sm space-y-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Shipment-Level Charges</p>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>{estimateReceipt.breakdown?.deliveryModeAddon?.label}</span>
                                                        <span className="font-medium">{currencySymbol}{estimateReceipt.breakdown?.deliveryModeAddon?.amount?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Customs Clearance</span>
                                                        <span className="font-medium">{currencySymbol}{estimateReceipt.breakdown?.standardFees?.customsClearance?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Handling Fee</span>
                                                        <span className="font-medium">{currencySymbol}{estimateReceipt.breakdown?.standardFees?.handlingFee?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Fuel Surcharge ({estimateReceipt.breakdown?.standardFees?.fuelSurcharge?.percentage}% of base freight)</span>
                                                        <span className="font-medium">{currencySymbol}{estimateReceipt.breakdown?.standardFees?.fuelSurcharge?.amount?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2 mt-1">
                                                        <span>Grand Total</span>
                                                        <span className="text-slate-900">{currencySymbol}{estimateReceipt.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <InputField
                                            label="Base Freight Charge"
                                            prefix={currencySymbol}
                                            value={baseFreightCharge}
                                            onChange={setBaseFreightCharge}
                                        />
                                        <InputField
                                            label="Estimated Handling Fee"
                                            prefix={currencySymbol}
                                            value={estimatedHandlingFee}
                                            onChange={setEstimatedHandlingFee}
                                        />
                                    </div>

                                    {/* Per-item shipping charges */}
                                    {quotation.items?.length > 0 && (
                                        <div className="pt-2 border-t border-slate-200">
                                            <label className="block text-sm font-semibold text-slate-600 mb-3 mt-4">Itemized Shipping Rates</label>
                                            <div className="space-y-3">
                                                {quotation.items.map((item: any, i: number) => (
                                                    <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-slate-300 transition-colors">
                                                        <div className="flex justify-between items-start mb-2.5">
                                                            <div className="text-xs font-bold text-slate-700 truncate pr-2 w-[70%]" title={item.description}>{item.description}</div>
                                                            <div className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">Qty: {item.quantity || 1}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder={`${currencySymbol} 0.00`}
                                                                value={itemPrices[i]?.shippingCharge || ''}
                                                                onChange={e => setItemPrices(prev => ({
                                                                    ...prev,
                                                                    [i]: { shippingCharge: e.target.value ? Number(e.target.value) : 0 }
                                                                }))}
                                                                className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-inner bg-slate-50"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    <div className="pt-4 border-t border-slate-200">
                                        <label className="block text-sm font-semibold text-slate-600 mb-2">Internal / Customer Notes</label>
                                        <textarea
                                            value={pricingNotes}
                                            onChange={e => setPricingNotes(e.target.value)}
                                            placeholder="Ex: Includes export customs clearance and origin handling."
                                            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none h-24"
                                        />
                                    </div>

                                    {/* Quote Summary Overview */}
                                    <div className="bg-slate-50 rounded-lg p-5 mt-4 border border-slate-200 shadow-sm text-slate-700">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4 border-b border-slate-200 pb-2">Estimated Setup Preview</p>
                                        <div className="flex justify-between items-center text-sm mb-2 font-medium">
                                            <span className="opacity-80">Base + Handling</span>
                                            <span className="text-slate-900 font-bold">{currencySymbol}{(Number(baseFreightCharge || 0) + Number(estimatedHandlingFee || 0)).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm mb-4 font-medium">
                                            <span className="opacity-80">Items Shipping Block</span>
                                            <span className="text-slate-900 font-bold">{currencySymbol}{itemsTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center font-bold text-slate-900 border-t border-slate-200 pt-3 text-xl">
                                            <span className="text-slate-900">Subtotal ({currency})</span>
                                            <span className="text-slate-600">{currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePriceQuotation}
                                        disabled={sending}
                                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold tracking-wide rounded-lg transition-all shadow-sm disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
                                    >
                                        {sending ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Transmitting...</>
                                        ) : (
                                            <>Submit & Send Quote to Client</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Action Panel: PENDING_CUSTOMER_APPROVAL ────────── */}
                        {quotation.status === 'PENDING_CUSTOMER_APPROVAL' && (
                            <div className="bg-white border text-center p-8 rounded-md shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-200"></div>
                                <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4 relative z-10" />
                                <h3 className="text-lg font-bold text-slate-800 relative z-10 tracking-tight">Awaiting Customer Decision</h3>
                                <p className="text-sm text-slate-500 mt-2 font-medium relative z-10">
                                    Quotation has been priced completely and pushed to the client application. Editing capabilities are suspended until they respond.
                                </p>
                            </div>
                        )}

                        {/* ── Action Panel: AWAITING_FINAL_CHARGE_SHEET ────────── */}
                        {quotation.status === 'AWAITING_FINAL_CHARGE_SHEET' && (
                            <div className="bg-white rounded-md shadow-sm overflow-hidden border border-slate-200 relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-300"></div>
                                <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 text-slate-600 rounded-full"><Check className="w-5 h-5" /></div>
                                    <h3 className="font-bold text-slate-900">Final Charge Sheet</h3>
                                </div>
                                <div className="p-5 space-y-6 bg-slate-50">
                                    <p className="text-sm text-slate-600 font-medium">
                                        Client has authorized the shipment parameters. You must formally lock the final execution miles to convert to invoice.
                                    </p>

                                    {(fd?.pickupType || fd?.deliveryType) && (
                                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 space-y-1">
                                            {fd?.pickupType && (
                                                <p>
                                                    <span className="font-semibold text-slate-700">Pickup:</span>{' '}
                                                    {fd.pickupType === 'HOME_PICKUP'
                                                        ? 'Home pickup — first-mile charge may be greater than zero if applicable.'
                                                        : 'Warehouse drop-off — first-mile charge must stay at 0.'}
                                                </p>
                                            )}
                                            {fd?.deliveryType && (
                                                <p>
                                                    <span className="font-semibold text-slate-700">Delivery:</span>{' '}
                                                    {fd.deliveryType === 'HOME_DELIVERY'
                                                        ? 'Home delivery — last-mile charge may be greater than zero if applicable.'
                                                        : 'Warehouse pickup — last-mile charge must stay at 0.'}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <InputField
                                            label="First Mile Charge (Pickup)"
                                            prefix={currencySymbol}
                                            value={firstMileCharge}
                                            onChange={setFirstMileCharge}
                                            disabled={fd?.pickupType === 'WAREHOUSE_DROP'}
                                        />
                                        <InputField
                                            label="Last Mile Charge (Delivery)"
                                            prefix={currencySymbol}
                                            value={lastMileCharge}
                                            onChange={setLastMileCharge}
                                            disabled={fd?.deliveryType === 'WAREHOUSE_PICKUP'}
                                        />
                                    </div>

                                    <button
                                        onClick={handleFinalizeChargeSheet}
                                        disabled={sending}
                                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold tracking-wide rounded-md transition-all shadow-sm disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
                                    >
                                        {sending ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Committing data...</>
                                        ) : (
                                            <>Finalize Sheet & Issue Invoice</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Simple Status Indicator Panels ────────── */}
                        {quotation.status === 'PAYMENT_PENDING' && (
                            <div className="bg-white border border-slate-200 text-center p-8 rounded-md shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-300"></div>
                                <IndianRupee className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Active Invoice Issued</h3>
                                <p className="text-sm text-slate-500 mt-2 font-medium">Tracking integration pending system payment verification from the client side.</p>
                            </div>
                        )}

                        {(quotation.status === 'ACCEPTED' || quotation.status === 'CONVERTED_TO_SHIPMENT') && (
                            <div className="bg-white border border-slate-200 text-center p-8 rounded-md shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-300"></div>
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Quotation Fully Converted</h3>
                                <p className="text-sm text-slate-500 mt-2 font-medium">The lifecycle of this quotation node is successful and locked.</p>
                            </div>
                        )}

                        {quotation.status === 'REJECTED' && (
                            <div className="bg-white border border-slate-200 text-center p-8 rounded-md shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-300"></div>
                                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Client Reject Status</h3>
                                <p className="text-sm text-slate-500 mt-2 font-medium mb-4">This quotation was aborted by the application end-user.</p>

                                {quotation.clientRejectionReason && (
                                    <div className="bg-red-50/50 p-4 rounded-md border border-red-100 text-left relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5 ml-2">Logged Context</p>
                                        <p className="text-sm text-red-900 font-medium italic ml-2">{quotation.clientRejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}
