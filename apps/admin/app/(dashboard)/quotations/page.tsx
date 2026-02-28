'use client';

import { useEffect, useState } from 'react';
import RequestDetailsModal from '../../components/RequestDetailsModal';
import StatusBadge from '../../components/StatusBadge';
import TableSkeleton from '../../components/TableSkeleton';
import TableEmptyState from '../../components/TableEmptyState';

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

                    // Show all quotations as requested
                    setQuotations(data);
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
            <h1 className="text-3xl font-bold text-foreground">All Quotations</h1>

            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 border-collapse">
                        <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 tracking-wider">
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
                                <TableSkeleton columns={7} />
                            ) : quotations.length === 0 ? (
                                <TableEmptyState
                                    colSpan={7}
                                    title="No quotations found"
                                    description="You don't have any generated quotations yet."
                                />
                            ) : (
                                quotations.map((q, index) => (
                                    <tr key={q._id || q.id || q.quotationId || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-sky-700">{q.quotationId}</td>
                                        <td className="px-6 py-4 text-gray-800 font-medium">{q.clientId?.fullName}</td>
                                        <td className="px-6 py-4">{q.destination?.city}</td>
                                        <td className="px-6 py-4 text-gray-800 font-medium">{q.currency} {q.totalAmount?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={q.status} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedRequestId(q.id || q._id)}
                                                className="text-sky-700 font-medium hover:underline transition-colors"
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
