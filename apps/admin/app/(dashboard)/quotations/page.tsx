'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '../../components/StatusBadge';
import TableSkeleton from '../../components/TableSkeleton';
import TableEmptyState from '../../components/TableEmptyState';

const STATUS_FILTERS = [
    { label: 'All', value: '' },
    { label: 'Pending Review', value: 'PENDING_ADMIN_REVIEW' },
    { label: 'Sent to Customer', value: 'PENDING_CUSTOMER_APPROVAL' },
    { label: 'Awaiting Charges', value: 'AWAITING_FINAL_CHARGE_SHEET' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Rejected', value: 'REJECTED' },
];

export default function QuotationsPage() {
    const router = useRouter();
    const [quotations, setQuotations] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const fetchQuotations = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) { router.push('/login'); return; }

            const res = await fetch('/api/quotations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.clear();
                router.push('/login');
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setQuotations(data.quotations || []);
            } else {
                setError(`Failed to load (${res.status})`);
            }
        } catch {
            setError('Network error — could not reach the server.');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

    // Filter + search
    useEffect(() => {
        let result = [...quotations];
        if (statusFilter) result = result.filter(q => q.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.quotationId?.toLowerCase().includes(q) ||
                r.clientId?.fullName?.toLowerCase().includes(q) ||
                r.routingData?.destinationCity?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
        setCurrentPage(1);
    }, [quotations, statusFilter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

    return (
        <div className="flex flex-col gap-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quotation Requests</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage all client quotation requests and pricing workflow</p>
                </div>
                <button
                    onClick={fetchQuotations}
                    className="self-start sm:self-auto px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition"
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <input
                    type="text"
                    placeholder="Search by ID, client name, destination..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
                {/* Status Filter Tabs */}
                <div className="flex gap-1 flex-wrap">
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setStatusFilter(f.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${statusFilter === f.value
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 border-collapse">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-5 py-4">Ref #</th>
                                <th className="px-5 py-4">Client</th>
                                <th className="px-5 py-4">Route</th>
                                <th className="px-5 py-4">Items</th>
                                <th className="px-5 py-4">Total</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Date</th>
                                <th className="px-5 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <TableSkeleton columns={8} />
                            ) : error ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-red-500 font-medium">{error}</td>
                                </tr>
                            ) : paged.length === 0 ? (
                                <TableEmptyState
                                    colSpan={8}
                                    title="No quotations found"
                                    description={statusFilter ? `No quotations with status "${statusFilter}".` : "No quotation requests yet."}
                                />
                            ) : (
                                paged.map((q) => {
                                    const id = q._id || q.id;
                                    const origin = q.routingData?.sourceCity || q.origin?.city || '—';
                                    const dest = q.routingData?.destinationCity || q.destination?.city || '—';
                                    const itemCount = q.items?.length || 0;
                                    return (
                                        <tr
                                            key={id}
                                            className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                            onClick={() => router.push(`/quotations/${id}`)}
                                        >
                                            <td className="px-5 py-4 font-mono text-xs text-sky-700 font-semibold">
                                                {q.quotationId || id?.slice(-8).toUpperCase()}
                                            </td>
                                            <td className="px-5 py-4 font-medium text-gray-800">
                                                <div className="truncate max-w-[140px]" title={q.clientId?.fullName}>
                                                    {q.clientId?.fullName || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-400">{q.clientId?.email}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-gray-700">{origin}</span>
                                                <span className="mx-1 text-gray-400">→</span>
                                                <span className="text-gray-700">{dest}</span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                                                    {itemCount}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-gray-800">
                                                {q.totalAmount ? `${q.currency || 'USD'} ${q.totalAmount.toLocaleString()}` : '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={q.status} />
                                            </td>
                                            <td className="px-5 py-4 text-gray-400 text-xs">
                                                {formatDate(q.createdAt)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={e => { e.stopPropagation(); router.push(`/quotations/${id}`); }}
                                                    className="px-3 py-1.5 text-xs font-medium text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-50 transition-all group-hover:border-sky-400"
                                                >
                                                    {q.status === 'PENDING_ADMIN_REVIEW' ? '⚡ Price Now' : 'View →'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex gap-1">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                            >← Prev</button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-9 h-9 text-sm rounded-lg transition ${p === currentPage ? 'bg-primary text-white font-bold' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                                >{p}</button>
                            ))}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                            >Next →</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
