import React from 'react';
import { Quotation } from '../../types';

interface LiveQuotationLedgerProps {
    quotation: Quotation;
}

const CURRENCY_SYMBOL: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', AED: 'AED ', CNY: '¥', JPY: '¥', INR: '₹',
};

export const LiveQuotationLedger: React.FC<LiveQuotationLedgerProps> = ({ quotation }) => {
    const cur = quotation.currency || 'USD';
    const sym = CURRENCY_SYMBOL[cur] || '$';

    // Admin has NOT priced yet
    const isPendingReview = quotation.status === 'PENDING_ADMIN_REVIEW' || quotation.status === 'DRAFT';

    const formatMoney = (val: number | undefined | null, fallback = 'Pending') => {
        if (val === null || val === undefined || val === 0) return fallback;
        return `${sym}${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString?: Date | string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    return (
        <div className="bg-white text-black p-8 max-w-4xl mx-auto border border-gray-300 shadow-sm font-sans">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                    <h1 className="text-4xl font-bold tracking-wider text-blue-600 mb-2">QUOTATION</h1>
                    <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded mb-6 border border-gray-200">
                        {quotation.status?.replace(/_/g, ' ')}
                    </div>

                    <div className="mt-4">
                        <h3 className="text-lg font-bold text-gray-700 mb-1">TO:</h3>
                        <p className="font-semibold text-gray-800">{(quotation.clientId as any)?.fullName || 'Customer'}</p>
                        <p className="text-gray-600 text-sm">
                            {quotation.routingData?.sourceCity && (
                                <span>From: <strong>{quotation.routingData.sourceCity}</strong>{quotation.routingData.sourceRegion ? `, ${quotation.routingData.sourceRegion}` : ''}</span>
                            )}
                            {quotation.routingData?.destinationCity && (
                                <span className="ml-4">→ To: <strong>{quotation.routingData.destinationCity}</strong>{quotation.routingData.destinationRegion ? `, ${quotation.routingData.destinationRegion}` : ''}</span>
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

            {/* ── Items Table ── */}
            <table className="w-full text-sm border-collapse border border-gray-300 mb-8">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 w-12">#</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Item / Description</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 w-16">Qty</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 w-24">Weight</th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-blue-700 w-32">
                            Declared Value<br /><span className="text-xs font-normal text-blue-400">(Commercial)</span>
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700 w-32">
                            Shipping Charge<br /><span className="text-xs font-normal text-gray-400">(Freight)</span>
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700 w-28">Line Total</th>
                    </tr>
                </thead>
                <tbody>
                    {quotation.items?.map((item: any, index: number) => {
                        const sc = item.shippingCharge || item.unitPrice || 0;
                        const lineTotal = sc * (item.quantity || 1);
                        return (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-3 text-center text-gray-800">{index + 1}</td>
                                <td className="border border-gray-300 px-3 py-3 text-gray-800">
                                    <div className="font-medium">{item.description}</div>
                                    {item.category && <div className="text-xs text-gray-500 mt-0.5 capitalize">{item.category}</div>}
                                    {item.isHazardous && <div className="text-xs text-red-600 mt-0.5">⚠ Hazardous</div>}
                                </td>
                                <td className="border border-gray-300 px-3 py-3 text-center text-gray-800">{item.quantity}</td>
                                <td className="border border-gray-300 px-3 py-3 text-center text-gray-600 text-xs">
                                    {item.weight ? `${item.weight} kg` : '—'}
                                    {item.packingVolume ? <><br />{item.packingVolume} CBM</> : null}
                                </td>
                                {/* Client-provided commercial value — read-only context for admin */}
                                <td className="border border-gray-300 px-3 py-3 text-right text-blue-700 font-medium">
                                    {item.declaredValue ? `${sym}${Number(item.declaredValue).toFixed(2)}` : '—'}
                                </td>
                                {/* Admin-set shipping charge */}
                                <td className="border border-gray-300 px-3 py-3 text-right text-gray-800 font-medium">
                                    {isPendingReview
                                        ? <span className="text-orange-500 italic text-xs">Pending</span>
                                        : formatMoney(sc, '—')
                                    }
                                </td>
                                <td className="border border-gray-300 px-3 py-3 text-right text-gray-800 font-bold">
                                    {isPendingReview || sc === 0
                                        ? <span className="text-orange-400 italic text-xs">Pending</span>
                                        : formatMoney(lineTotal)
                                    }
                                </td>
                            </tr>
                        );
                    })}
                    {(!quotation.items || quotation.items.length === 0) && (
                        <tr>
                            <td colSpan={7} className="border border-gray-300 px-3 py-6 text-center text-gray-500 italic">
                                No items available currently.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pricing Summary */}
            <div className="flex justify-between items-start">
                <div className="w-1/2 pr-8 text-sm text-gray-600">
                    <p className="mb-2"><span className="font-semibold text-gray-800">Terms & Conditions:</span></p>
                    <p className="whitespace-pre-line text-xs">
                        {quotation.termsAndConditions || 'Standard B&B International shipping terms apply. Liability limited as per standard waybill terms. Rates subject to final verification of weights and dimensions.'}
                    </p>
                    {quotation.additionalNotes && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs font-semibold text-amber-800 mb-1">📝 Admin Note:</p>
                            <p className="text-xs text-amber-700">{quotation.additionalNotes}</p>
                        </div>
                    )}
                </div>

                <div className="w-1/2">
                    <div className="bg-gray-50 p-4 border border-gray-200 flex flex-col gap-2 shadow-sm">
                        {(quotation.baseFreightCharge ?? 0) > 0 && (
                            <div className="flex justify-between text-sm text-gray-700">
                                <span>Base Freight Charge</span>
                                <span className="font-medium">{formatMoney(quotation.baseFreightCharge)}</span>
                            </div>
                        )}
                        {(quotation.estimatedHandlingFee ?? 0) > 0 && (
                            <div className="flex justify-between text-sm text-gray-700">
                                <span>Estimated Handling Fee</span>
                                <span className="font-medium">{formatMoney(quotation.estimatedHandlingFee)}</span>
                            </div>
                        )}
                        {(quotation.firstMileCharge ?? 0) > 0 && (
                            <div className="flex justify-between text-sm text-gray-700">
                                <span>First Mile Charge</span>
                                <span className="font-medium">{formatMoney(quotation.firstMileCharge)}</span>
                            </div>
                        )}
                        {(quotation.lastMileCharge ?? 0) > 0 && (
                            <div className="flex justify-between text-sm text-gray-700">
                                <span>Last Mile Charge</span>
                                <span className="font-medium">{formatMoney(quotation.lastMileCharge)}</span>
                            </div>
                        )}
                        {(quotation.tax ?? 0) > 0 && (
                            <div className="flex justify-between text-sm text-gray-700">
                                <span>Tax ({quotation.taxRate}%)</span>
                                <span className="font-medium">{formatMoney(quotation.tax)}</span>
                            </div>
                        )}
                        {(quotation.discount ?? 0) > 0 && (
                            <div className="flex justify-between text-sm text-green-700">
                                <span>Discount</span>
                                <span className="font-medium">-{formatMoney(quotation.discount)}</span>
                            </div>
                        )}

                        <div className="border-t border-gray-300 my-2"></div>

                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-800">
                                {isPendingReview ? 'Quote Pending' : 'Final Quoted Amount'}
                            </span>
                            <span className="text-xl font-bold text-blue-700">
                                {isPendingReview
                                    ? <span className="text-orange-500 text-base italic">Awaiting Admin Pricing</span>
                                    : formatMoney(quotation.totalAmount)
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
