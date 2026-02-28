'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import LiveQuotationLedger from '../../../components/LiveQuotationLedger';
import { Quotation } from '../../../../types'; // adjust path if needed

export default function QuotationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const router = useRouter();

    // PENDING_ADMIN_REVIEW State
    const [baseFreightCharge, setBaseFreightCharge] = useState<number>(0);
    const [estimatedHandlingFee, setEstimatedHandlingFee] = useState<number>(0);
    const [itemPrices, setItemPrices] = useState<{ [key: number]: number }>({});

    // AWAITING_FINAL_CHARGE_SHEET State
    const [firstMileCharge, setFirstMileCharge] = useState<number>(0);
    const [lastMileCharge, setLastMileCharge] = useState<number>(0);

    const fetchQuotation = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/quotations/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuotation(data);

                // Pre-fill existing item costs if available
                if (data.items) {
                    const initialPrices: { [key: number]: number } = {};
                    data.items.forEach((item: any, i: number) => {
                        initialPrices[i] = item.unitPrice || 0;
                    });
                    setItemPrices(initialPrices);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotation();
    }, [id]);

    const handlePriceQuotation = async () => {
        setSending(true);
        try {
            const token = localStorage.getItem('token');

            // Re-construct items with updated prices
            const updatedItems = quotation.items?.map((item: any, index: number) => ({
                ...item,
                unitPrice: itemPrices[index] || 0,
                amount: (itemPrices[index] || 0) * (item.quantity || 1)
            })) || [];

            const body = {
                baseFreightCharge: Number(baseFreightCharge),
                estimatedHandlingFee: Number(estimatedHandlingFee),
                items: updatedItems,
                // Or itemizedCosts depending on API, send both to be safe:
                itemizedCosts: updatedItems.reduce((sum: number, i: any) => sum + i.amount, 0),
                subtotal: Number(baseFreightCharge) + Number(estimatedHandlingFee) + updatedItems.reduce((sum: number, i: any) => sum + i.amount, 0)
            };

            const res = await fetch(`/api/quotations/${id}/workflow/price`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Quotation priced successfully and sent to customer');
                fetchQuotation();
            } else {
                const error = await res.json();
                alert(`Error: ${error.message}`);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to submit pricing');
        } finally {
            setSending(false);
        }
    };

    const handleFinalizeChargeSheet = async () => {
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/quotations/${id}/workflow/finalize-charges`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstMileCharge: Number(firstMileCharge),
                    lastMileCharge: Number(lastMileCharge)
                })
            });

            if (res.ok) {
                alert('Charge sheet finalized successfully');
                fetchQuotation();
            } else {
                const error = await res.json();
                alert(`Error: ${error.message}`);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to finalize charge sheet');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!quotation) return <div className="p-8">Quotation not found</div>;

    const renderActionPanel = () => {
        if (quotation.status === 'PENDING_ADMIN_REVIEW' || quotation.status === 'request_sent' || quotation.status === 'PENDING_ADMIN_REVIEW') {
            return (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Price Quotation (Admin Action)</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Freight Charge</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    className="pl-8 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={baseFreightCharge}
                                    onChange={e => setBaseFreightCharge(e.target.value ? Number(e.target.value) : 0)}
                                    min="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Handling Fee</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    className="pl-8 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={estimatedHandlingFee}
                                    onChange={e => setEstimatedHandlingFee(e.target.value ? Number(e.target.value) : 0)}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {quotation.items && quotation.items.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-md font-semibold text-gray-700 mb-3">Itemized Pricing</h3>
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                        {quotation.items.map((item: any, i: number) => (
                                            <tr key={i}>
                                                <td className="px-4 py-3 text-gray-800 font-medium">{item.description}</td>
                                                <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end items-center">
                                                        <span className="mr-2 text-gray-500">$</span>
                                                        <input
                                                            type="number"
                                                            className="w-24 text-right border border-gray-300 rounded-lg p-1.5 focus:ring-blue-500 focus:border-blue-500"
                                                            value={itemPrices[i] || 0}
                                                            onChange={e => setItemPrices({ ...itemPrices, [i]: e.target.value ? Number(e.target.value) : 0 })}
                                                            min="0"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
                            onClick={handlePriceQuotation}
                            disabled={sending}
                        >
                            {sending ? 'Sending...' : 'Send Priced Quotation to Customer'}
                        </button>
                    </div>
                </div>
            );
        }

        if (quotation.status === 'AWAITING_FINAL_CHARGE_SHEET') {
            return (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Finalize Charge Sheet (Admin Action)</h2>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer Fulfillment Details provided:</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                                <span className="block font-medium text-gray-500 mb-1">Origin Details</span>
                                <p>{quotation.origin?.addressLine || 'N/A'}</p>
                                <p>{quotation.origin?.city}, {quotation.origin?.country}</p>
                            </div>
                            <div>
                                <span className="block font-medium text-gray-500 mb-1">Destination Details</span>
                                <p>{quotation.destination?.addressLine || 'N/A'}</p>
                                <p>{quotation.destination?.city}, {quotation.destination?.country}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Mile Charge (Origin Pickup)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    className="pl-8 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={firstMileCharge}
                                    onChange={e => setFirstMileCharge(e.target.value ? Number(e.target.value) : 0)}
                                    min="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Mile Charge (Destination Delivery)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    className="pl-8 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={lastMileCharge}
                                    onChange={e => setLastMileCharge(e.target.value ? Number(e.target.value) : 0)}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
                            onClick={handleFinalizeChargeSheet}
                            disabled={sending}
                        >
                            {sending ? 'Finalizing...' : 'Finalize Charge Sheet'}
                        </button>
                    </div>
                </div>
            );
        }

        if (quotation.status === 'PENDING_CUSTOMER_APPROVAL' || quotation.status === 'PAYMENT_PENDING') {
            return (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl mt-8 flex items-center shadow-sm">
                    <div className="text-yellow-600 mr-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-yellow-800">Waiting for Customer Action...</h3>
                        <p className="text-sm text-yellow-700 mt-1">This quotation is currently locked from admin edits while the customer reviews it.</p>
                    </div>
                </div>
            );
        }

        return null; // Other statuses default to just displaying the Read-Only Ledger
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 pb-20">
            <div className="mb-6 flex justify-between items-center max-w-4xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Iterative Quotation Manager</h1>
                    <p className="text-sm text-gray-500">Live preview and workflow actions.</p>
                </div>
                <button
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => router.back()}
                >
                    &larr; Back
                </button>
            </div>

            {/* Top Section: Live Quotation Ledger Preview */}
            <div className="mb-8">
                <LiveQuotationLedger quotation={quotation as Quotation} />
            </div>

            {/* Bottom Section: Contextual Action Panel */}
            <div className="max-w-4xl mx-auto">
                {renderActionPanel()}
            </div>
        </div>
    );
}
