'use client';

import { useEffect, useState, useCallback } from 'react';
import RequestDetailsModal from '../../components/RequestDetailsModal';

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

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

                    // Filter for request statuses
                    const requestStatuses = ['PENDING_REVIEW', 'INFO_REQUIRED', 'VERIFIED', 'ADDRESS_PROVIDED', 'DRAFT'];
                    const filteredRequests = data.filter((q: any) => requestStatuses.includes(q.status));

                    setRequests(filteredRequests);
                    setTotalPages(Math.ceil(filteredRequests.length / itemsPerPage));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, [itemsPerPage]);

    const getStatusStyle = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'new' || s === 'request_sent' || s === 'draft') return 'text-blue-600 font-medium';
        if (s === 'pending_review' || s === 'address_provided' || s === 'verified') return 'text-orange-500 font-medium';
        if (s === 'info_required') return 'text-red-600 font-medium';
        return 'text-gray-600';
    };

    const getStatusLabel = (status: string) => {
        return status?.replace(/_/g, ' ') || 'UNKNOWN';
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        });
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRequests = requests.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <h1 className="text-3xl font-semibold text-zinc-800">Quotation Requests</h1>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">

                {/* Table */}
                <div className="w-full overflow-x-auto shadow-sm rounded-lg border border-gray-100">
                    <table className="min-w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F1F5F9] text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <th className="px-4 py-4 whitespace-nowrap">Sl No.</th>
                                <th className="px-4 py-4 whitespace-nowrap">Name</th>
                                <th className="px-4 py-4 whitespace-nowrap">Location</th>
                                <th className="px-4 py-4 whitespace-nowrap">Contact</th>
                                <th className="px-4 py-4 whitespace-nowrap">Delivery Type</th>
                                <th className="px-4 py-4 whitespace-nowrap">#Boxes</th>
                                <th className="px-4 py-4 whitespace-nowrap">CBM</th>
                                <th className="px-4 py-4 whitespace-nowrap">Weight</th>
                                <th className="px-4 py-4 whitespace-nowrap">Destination</th>
                                <th className="px-4 py-4 whitespace-nowrap">Request#</th>
                                <th className="px-4 py-4 whitespace-nowrap">Expiry#</th>
                                <th className="px-4 py-4 whitespace-nowrap">Status</th>
                                <th className="px-4 py-4 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-600 divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={13} className="px-4 py-8 text-center text-slate-400">Loading data...</td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="px-4 py-8 text-center text-slate-400">No new requests found.</td>
                                </tr>
                            ) : (
                                currentRequests.map((req, index) => (
                                    <tr key={req.id || req._id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-4 py-4 text-slate-400 whitespace-nowrap">
                                            #{String(indexOfFirstItem + index + 1).padStart(3, '0')}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-slate-700 whitespace-nowrap" title={req.clientId?.fullName || 'Unknown'}>
                                            <div className="truncate max-w-[150px]">
                                                {req.clientId?.fullName || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{req.origin?.city || 'N/A'}</td>
                                        <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">
                                            {req.clientId?.phone || req.origin?.phone || 'N/A'}
                                        </td>
                                        <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">{req.serviceType || 'Standard'}</td>
                                        <td className="px-4 py-4 text-center whitespace-nowrap">{req.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0}</td>
                                        <td className="px-4 py-4 text-center whitespace-nowrap">-</td>
                                        <td className="px-4 py-4 text-center whitespace-nowrap">-</td>
                                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{req.destination?.city || 'N/A'}</td>
                                        <td className="px-4 py-4 text-xs whitespace-nowrap">{req.quotationId?.split('-').pop() || 'N/A'}</td>
                                        <td className="px-4 py-4 text-xs whitespace-nowrap">{formatDate(req.validUntil)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={getStatusStyle(req.status)}>
                                                {getStatusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 relative whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedRequestId(req._id || req.id)}
                                                className="text-gray-400 hover:text-blue-600 px-3 py-1 rounded-md text-sm transition-colors border border-transparent hover:border-gray-200 hover:bg-white min-h-[32px]"
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-end items-center mt-6 gap-2">
                        {getPageNumbers().map((page, idx) => (
                            <button
                                key={idx}
                                disabled={page === '...'}
                                onClick={() => typeof page === 'number' && handlePageChange(page)}
                                className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors
                                    ${page === currentPage
                                        ? 'bg-blue-700 text-white font-medium'
                                        : page === '...'
                                            ? 'text-slate-400 cursor-default'
                                            : 'text-slate-500 hover:bg-gray-100'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
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
