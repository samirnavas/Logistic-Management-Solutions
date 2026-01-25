'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';


export default function QuotationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchQuotation = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/quotations/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setQuotation(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuotation();
    }, [id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!quotation) return <div className="p-8">Quotation not found</div>;

    return (
        <div className="flex justify-center items-start min-h-screen p-8 bg-neutral-100">
            <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Quotation ID</span>
                        <h1 className="text-2xl font-bold text-zinc-800">{quotation.quotationId}</h1>
                        <span className="text-sm text-gray-500 mt-2 block">
                            Request: <span className="font-medium text-gray-700">{quotation.quotationNumber}</span>
                        </span>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${quotation.status === 'Accepted' || quotation.status === 'ready_for_pickup' ? 'bg-green-100 text-green-700' :
                        quotation.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-sky-100 text-sky-700'
                        }`}>
                        {quotation.status}
                    </div>
                </div>

                {/* Financial Details */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold text-zinc-800 mb-6 border-l-4 border-sky-700 pl-3">Price Breakdown</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                        <div>
                            <span className="text-sm text-zinc-500 block mb-1">Total Amount</span>
                            <div className="text-2xl font-bold text-sky-700">
                                {quotation.currency} {quotation.totalAmount?.toLocaleString()}
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
                    {/* Add actions like "Edit" or "Download PDF" here */}
                </div>
            </div>
        </div>
    );
}
