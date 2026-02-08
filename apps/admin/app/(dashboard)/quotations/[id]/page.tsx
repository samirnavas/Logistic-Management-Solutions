'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function QuotationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [warehouseMessage, setWarehouseMessage] = useState('');
    const [sending, setSending] = useState(false);
    const router = useRouter();

    const fetchQuotation = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/quotations/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuotation(data);
                if (data.warehouseDropOffLocation) {
                    setWarehouseMessage(data.warehouseDropOffLocation);
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

    const handleSendWarehouseDetails = async () => {
        if (!warehouseMessage.trim()) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/quotations/${id}/warehouse-details`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ locationMessage: warehouseMessage })
            });

            if (res.ok) {
                alert('Warehouse details sent successfully');
                setIsWarehouseModalOpen(false);
                fetchQuotation(); // Refresh data
            } else {
                const error = await res.json();
                alert(`Error: ${error.message}`);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to send details');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!quotation) return <div className="p-8">Quotation not found</div>;

    const canSendWarehouseDetails = quotation.handoverMethod === 'DROP_OFF' &&
        ['QUOTATION_SENT', 'ACCEPTED', 'BOOKED'].includes(quotation.status);

    return (
        <div className="flex justify-center items-start min-h-screen p-8 bg-neutral-100">
            <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm p-8 relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Quotation ID</span>
                        <h1 className="text-2xl font-bold text-zinc-800">{quotation.quotationId}</h1>
                        <span className="text-sm text-gray-500 mt-2 block">
                            Request: <span className="font-medium text-gray-700">{quotation.quotationNumber}</span>
                        </span>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${quotation.status === 'ACCEPTED' || quotation.status === 'BOOKED' ? 'bg-green-100 text-green-700' :
                        quotation.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-sky-100 text-sky-700'
                        }`}>
                        {quotation.status}
                    </div>
                </div>

                {/* Warehouse Location Info (if exists) */}
                {quotation.warehouseDropOffLocation && (
                    <div className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="text-sm font-semibold text-blue-800 mb-1">Warehouse Drop-off Location Sent</h3>
                        <p className="text-blue-700 whitespace-pre-wrap">{quotation.warehouseDropOffLocation}</p>
                    </div>
                )}

                {/* Financial Details */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold text-zinc-800 mb-6 border-l-4 border-sky-700 pl-3">Price Breakdown</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                        <div>
                            <span className="text-sm text-zinc-500 block mb-1">Total Amount</span>
                            <div className="text-2xl font-bold text-sky-700">
                                {quotation.currency || 'USD'} {quotation.totalAmount?.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <span className="text-sm text-zinc-500 block mb-1">Subtotal</span>
                            <div className="text-base font-medium text-zinc-800">{quotation.subtotal}</div>
                        </div>
                        <div>
                            <span className="text-sm text-zinc-500 block mb-1">Tax ({quotation.taxRate}%)</span>
                            <div className="text-base font-medium text-zinc-800">{quotation.tax}</div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Description</th>
                                    <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotation.items?.map((item: any, i: number) => (
                                    <tr key={i} className="border-t border-gray-100">
                                        <td className="px-4 py-3 text-sm text-gray-800">{item.description}</td>
                                        <td className="px-4 py-3 text-sm text-gray-800 text-right">{item.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Customer Information */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-zinc-800 mb-6 border-l-4 border-sky-700 pl-3">Customer Information</h2>
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm text-zinc-500 block mb-1">Name</span>
                                <div className="text-base font-medium text-zinc-800">{quotation.clientId?.fullName}</div>
                            </div>
                            <div>
                                <span className="text-sm text-zinc-500 block mb-1">Email</span>
                                <div className="text-base font-medium text-zinc-800">{quotation.clientId?.email}</div>
                            </div>
                        </div>
                    </div>

                    {/* Shipment Info */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-zinc-800 mb-6 border-l-4 border-sky-700 pl-3">Shipment Info</h2>
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm text-zinc-500 block mb-1">Handover Method</span>
                                <div className="text-base font-medium text-zinc-800">{quotation.handoverMethod}</div>
                            </div>
                            <div>
                                <span className="text-sm text-zinc-500 block mb-1">Origin</span>
                                <div className="text-base font-medium text-zinc-800">{quotation.origin?.city}, {quotation.origin?.country}</div>
                            </div>
                            <div>
                                <span className="text-sm text-zinc-500 block mb-1">Destination</span>
                                <div className="text-base font-medium text-zinc-800">{quotation.destination?.city}, {quotation.destination?.country}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-4">
                    <button
                        className="px-6 py-2.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => router.back()}
                    >
                        Back
                    </button>

                    {canSendWarehouseDetails && (
                        <button
                            className="px-6 py-2.5 bg-blue-600 rounded-full text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                            onClick={() => setIsWarehouseModalOpen(true)}
                        >
                            {quotation.warehouseDropOffLocation ? 'Update Warehouse Location' : 'Send Warehouse Location'}
                        </button>
                    )}
                </div>

                {/* Modal */}
                {isWarehouseModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                            <h3 className="text-lg font-bold mb-4">Send Warehouse Location</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Enter the warehouse address and instructions for the client to drop off their shipment.
                            </p>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 h-32 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g. Warehouse A, 123 Logistics Way..."
                                value={warehouseMessage}
                                onChange={(e) => setWarehouseMessage(e.target.value)}
                            ></textarea>
                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    onClick={() => setIsWarehouseModalOpen(false)}
                                    disabled={sending}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    onClick={handleSendWarehouseDetails}
                                    disabled={sending || !warehouseMessage.trim()}
                                >
                                    {sending ? 'Sending...' : 'Send Details'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
