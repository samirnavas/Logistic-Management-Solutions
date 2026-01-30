'use client';

import { useEffect, useState } from 'react';

import RequestDetailsModal from '../../components/RequestDetailsModal';

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/quotations', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const responseData = await res.json();
                    const data = responseData.quotations || [];
                    // Filter for 'request_sent' status (New Requests)
                    // Show all requests or filter as needed. For now showing all to support the new status list visibility.
                    setRequests(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);



    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING_REVIEW':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'VERIFIED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'NEGOTIATION_REQUESTED':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'INFO_REQUIRED':
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'ACCEPTED':
            case 'BOOKED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'QUOTATION_SENT':
            case 'QUOTATION_GENERATED':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'DRAFT':
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-xl font-medium text-zinc-800">Quotation Requests</h1>

            <div className="bg-white rounded-xl min-h-[600px] flex flex-col relative">
                <div className="overflow-x-auto pb-12">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-sky-700/10 text-zinc-800 font-normal">
                            <tr>
                                <th className="px-6 py-4 rounded-l-md">Sl No.</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Delivery Type</th>
                                <th className="px-6 py-4">#Boxes</th>
                                <th className="px-6 py-4">CBM</th>
                                <th className="px-6 py-4">Weight</th>
                                <th className="px-6 py-4">Destination</th>
                                <th className="px-6 py-4">Request#</th>
                                <th className="px-6 py-4">Expiry#</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 rounded-r-md">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={13} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={13} className="px-6 py-8 text-center text-zinc-500">No new requests found.</td></tr>
                            ) : (
                                requests.map((req, index) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors text-zinc-800/80">
                                        <td className="px-6 py-4">#{String(index + 1).padStart(3, '0')}</td>
                                        <td className="px-6 py-4">{req.clientId?.fullName || 'N/A'}</td>
                                        <td className="px-6 py-4">{req.origin?.city || 'N/A'}</td>
                                        <td className="px-6 py-4">{req.origin?.phone || req.clientId?.phone || 'N/A'}</td>
                                        <td className="px-6 py-4">{req.serviceType || 'Standard'}</td>
                                        <td className="px-6 py-4">{req.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0}</td>
                                        <td className="px-6 py-4">-</td>
                                        <td className="px-6 py-4">-</td>
                                        <td className="px-6 py-4">{req.destination?.city || 'N/A'}</td>
                                        <td className="px-6 py-4">{req.quotationId}</td>
                                        <td className="px-6 py-4">{req.validUntil ? new Date(req.validUntil).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}>
                                                {req.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedRequestId(req.id)}
                                                className="bg-white border border-gray-100 px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer text-xs font-normal text-zinc-800"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="mt-auto px-6 py-6 flex justify-center items-center gap-2">
                    <button className="w-8 h-8 rounded-md bg-sky-700 text-white flex items-center justify-center text-sm">1</button>
                    <button className="w-8 h-8 rounded-md hover:bg-gray-100 text-zinc-500 flex items-center justify-center text-sm">2</button>
                    <button className="w-8 h-8 rounded-md hover:bg-gray-100 text-zinc-500 flex items-center justify-center text-sm">3</button>
                    <span className="text-zinc-500">...</span>
                    <button className="w-8 h-8 rounded-md hover:bg-gray-100 text-zinc-500 flex items-center justify-center text-sm">67</button>
                    <button className="w-8 h-8 rounded-md hover:bg-gray-100 text-zinc-500 flex items-center justify-center text-sm">68</button>
                </div>
            </div>

            {selectedRequestId && (
                <RequestDetailsModal
                    requestId={selectedRequestId}
                    onClose={() => setSelectedRequestId(null)}
                    onStatusChange={() => {
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
