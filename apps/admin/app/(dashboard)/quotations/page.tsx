'use client';

import { useEffect, useState } from 'react';
import RequestDetailsModal from '../../components/RequestDetailsModal';

export default function QuotationsPage() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuotations = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/quotations', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const responseData = await res.json();
                    const data = responseData.quotations || [];

                    // Filter out 'request_sent' (as those are requests, not yet quotations)
                    const sentQuotes = data.filter((q: any) => q.status !== 'request_sent');
                    setQuotations(sentQuotes);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuotations();
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-semibold text-zinc-800">All Quotations</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Destination</th>
                                <th className="px-6 py-4">Total Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
                            ) : quotations.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-500">No quotations found.</td></tr>
                            ) : (
                                quotations.map((q) => (
                                    <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-sky-700">{q.quotationId}</td>
                                        <td className="px-6 py-4 text-zinc-800 font-medium">{q.clientId?.fullName}</td>
                                        <td className="px-6 py-4">{q.destination?.city}</td>
                                        <td className="px-6 py-4 text-zinc-800 font-medium">{q.currency} {q.totalAmount?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                                ${q.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                                                    q.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-800'}`}>
                                                {q.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">{new Date(q.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedRequestId(q._id)}
                                                className="text-gray-400 hover:text-sky-700 transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRequestId && (
                <RequestDetailsModal
                    requestId={selectedRequestId}
                    onClose={() => setSelectedRequestId(null)}
                />
            )}
        </div>
    );
}
