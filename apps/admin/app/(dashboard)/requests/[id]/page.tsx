'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showQuoteForm, setShowQuoteForm] = useState(false);
    const router = useRouter();

    // Quotation Form State
    const [quoteData, setQuoteData] = useState({
        price: '',
        taxRate: '10',
        notes: '',
        validUntil: ''
    });

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/quotations/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRequest(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [id]);

    const handleCreateQuotation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                items: [{
                    description: 'Freight Charges',
                    amount: Number(quoteData.price)
                }],
                taxRate: Number(quoteData.taxRate),
                validUntil: quoteData.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                internalNotes: quoteData.notes,
            };

            const updateRes = await fetch(`/api/quotations/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!updateRes.ok) throw new Error('Failed to update quotation details');

            const approveRes = await fetch(`/api/quotations/${id}/approve`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!approveRes.ok) throw new Error('Failed to approve quotation');

            const sendRes = await fetch(`/api/quotations/${id}/send`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!sendRes.ok) throw new Error('Failed to send quotation');

            setShowQuoteForm(false);
            router.push('/quotations');

        } catch (err) {
            console.error(err);
            alert('Error creating quotation');
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading details...</div>;
    if (!request) return <div className="p-8 text-center text-zinc-500">Request not found</div>;

    return (
        <div className="flex justify-center items-start min-h-screen p-8 bg-neutral-100">
            {/* Main Card mimicking the Modal Design */}
            <div className="w-[893px] bg-white rounded-lg shadow-sm relative p-8">

                {/* Close/Back Button (Optional standard UI practice) */}
                <button onClick={() => router.back()} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
                    ✕
                </button>

                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                    <h1 className="text-xl font-medium text-zinc-800">Request Detail</h1>
                    <div className="flex gap-4">
                        <div className="bg-slate-200 px-4 py-1.5 rounded-2xl text-sky-700 text-sm font-medium">
                            ID : {request.quotationId}
                        </div>
                        <div className="bg-slate-200 px-4 py-1.5 rounded-2xl text-sky-700 text-sm font-medium">
                            Status : {request.status === 'request_sent' ? 'New' : request.status}
                        </div>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Left Column: Customer Info */}
                    <div className="flex-1 bg-white rounded-lg shadow-[3px_3px_12px_0px_rgba(0,0,0,0.15)] p-6 h-96 relative">
                        <h2 className="text-lg font-medium text-zinc-800 mb-6">Customer Information</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Name</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.clientId?.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Email</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.clientId?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Mobile Number</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.clientId?.phone || request.origin?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-zinc-500 text-sm">Address</span>
                                <span className="text-zinc-800 text-sm font-medium text-right max-w-[150px]">
                                    {request.origin?.addressLine || '123, Street Name'},<br />
                                    {request.origin?.city}, {request.origin?.state}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Location</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.origin?.city}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Product & Delivery Details */}
                    <div className="flex-1 bg-white rounded-lg shadow-[3px_3px_12px_0px_rgba(0,0,0,0.15)] p-6 h-96 overflow-y-auto">
                        <h2 className="text-lg font-medium text-zinc-800 mb-6">Product & Delivery Details</h2>

                        <div className="space-y-4">
                            {/* Images Row */}
                            {request.productPhotos?.length > 0 && (
                                <div className="flex gap-4 mb-4">
                                    {request.productPhotos.map((photo: string, i: number) => (
                                        <img key={i} src={photo} alt="Product" className="w-16 h-16 rounded-lg object-cover" />
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Product Name</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.cargoType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Number of Boxes</span>
                                <span className="text-zinc-800 text-sm font-medium">
                                    {request.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Packaging Type</span>
                                <span className="text-zinc-800 text-sm font-medium">Secure Box</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Pickup Location</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.origin?.city}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Delivery Location</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.destination?.city}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Mode</span>
                                <span className="text-zinc-800 text-sm font-medium">{request.serviceType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Expected Delivery Timeline</span>
                                <span className="text-zinc-800 text-sm font-medium">3-4 Business Days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 text-sm">Special Instructions</span>
                                <span className="text-zinc-800 text-sm font-medium text-right">{request.specialInstructions || 'None'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-8 flex justify-center gap-6">
                    {request.status === 'request_sent' && (
                        <button
                            onClick={() => setShowQuoteForm(true)}
                            className="bg-sky-700 text-white px-8 py-2.5 rounded-full text-sm font-normal hover:bg-sky-800 transition-colors"
                        >
                            Create Quotation
                        </button>
                    )}
                    <button className="border border-sky-700 text-sky-700 px-8 py-2.5 rounded-full text-sm font-normal hover:bg-sky-50 transition-colors">
                        Add Internal Notes
                    </button>
                </div>
            </div>

            {/* Quotation Form Modal (Overlay) */}
            {showQuoteForm && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl w-[500px] p-8 shadow-xl">
                        <h2 className="text-xl font-semibold mb-6 text-zinc-800">Generate Quotation</h2>
                        <form onSubmit={handleCreateQuotation} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Freight Charges (Price)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-700/20 outline-none"
                                    value={quoteData.price}
                                    onChange={(e) => setQuoteData({ ...quoteData, price: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-700/20 outline-none"
                                        value={quoteData.taxRate}
                                        onChange={(e) => setQuoteData({ ...quoteData, taxRate: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-700/20 outline-none"
                                        value={quoteData.validUntil}
                                        onChange={(e) => setQuoteData({ ...quoteData, validUntil: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-700/20 outline-none"
                                    rows={3}
                                    value={quoteData.notes}
                                    onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                    onClick={() => setShowQuoteForm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-sky-700 text-white rounded-lg hover:bg-sky-800"
                                >
                                    Send Quotation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
