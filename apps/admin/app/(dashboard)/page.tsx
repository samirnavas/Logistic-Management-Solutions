'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Hourglass,
    CheckCircle,
    ChevronDown,
} from 'lucide-react';
import RequestDetailsModal from '../components/RequestDetailsModal';
import { Quotation, QuotationStats } from '../../types';

export default function DashboardPage() {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [stats, setStats] = useState<QuotationStats>({
        totalRequests: 0,
        pendingRequests: 0,
        totalQuotations: 0,
        pendingQuotations: 0,
        acceptedQuotations: 0,
    });
    const [loading, setLoading] = useState(true);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    // Filter State
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 8;

    const fetchData = useCallback(async (page: number, status: string = '') => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Build query params
            const params = new URLSearchParams({
                page: page.toString(),
                limit: itemsPerPage.toString(),
            });

            if (status) {
                params.append('status', status);
            }

            // Fetch Quotations with Pagination
            const resQuotations = await fetch(`/api/quotations?${params.toString()}`, { headers });
            if (resQuotations.ok) {
                const data = await resQuotations.json();
                setQuotations(data.quotations || []);
                setTotalPages(data.totalPages || 1);
                setCurrentPage(data.currentPage || 1);
            }

            // Fetch Stats (Only need to fetch once or on refresh)
            // Note: Stats usually reflect global state, checking if they should be filtered too?
            // Usually stats are top-level summaries, so maybe keep them unfiltered or based on separate logic.
            // For now, keeping them as is (global stats).
            const resStats = await fetch('/api/quotations/stats', { headers });
            if (resStats.ok) {
                const statsData = await resStats.json();
                setStats(statsData);
            }

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        fetchData(currentPage, statusFilter);
    }, [fetchData, currentPage, statusFilter]);

    // Handle Page Change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // useEffect will trigger fetch
        }
    };

    const handleStatusSelect = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1); // Reset to page 1 on filter change
        setShowStatusMenu(false);
    };

    const clearFilters = () => {
        setStatusFilter('');
        setCurrentPage(1);
    };

    const formatDate = (dateString: string | Date | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        });
    };

    const getStatusStyle = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'new' || s === 'request_sent') return 'text-blue-600 font-medium';
        if (s === 'pending' || s === 'cost_calculated' || s === 'sent' || s === 'pending approval') return 'text-orange-500 font-medium';
        if (s === 'accepted' || s === 'ready_for_pickup' || s === 'approved') return 'text-green-600 font-medium';
        if (s === 'rejected') return 'text-red-600 font-medium';
        return 'text-gray-600';
    };

    const getStatusLabel = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'request_sent') return 'New';
        if (s === 'cost_calculated') return 'Pending';
        if (s === 'pending approval') return 'Pending';
        if (s === 'ready_for_pickup') return 'Accepted';
        if (s === 'sent') return 'Pending';
        if (s === 'approved') return 'Approved';
        return status;
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        // If total pages <= 7, show all
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
        <div className="flex flex-col gap-8 pb-10" onClick={() => setShowStatusMenu(false)}>
            {/* Header */}
            <div className="flex justify-between items-end">
                <h1 className="text-3xl font-semibold text-zinc-800">Dashboard</h1>
                <Link
                    href="/requests"
                    className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm text-sm"
                >
                    View New Requests
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {/* Card 1: Total Quotation Requests (Blue) */}
                <div className="bg-[#EBF5FF] border border-blue-100 rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.totalRequests}</h3>
                        <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Total Quotation Requests</p>
                    </div>
                    <div className="absolute right-4 top-4 text-blue-400 bg-white p-2 rounded-full shadow-sm">
                        <div className="w-5 h-5 flex items-center justify-center border-2 border-blue-400 rounded-full text-[10px] font-bold">=</div>
                    </div>
                </div>

                {/* Card 2: Pending Requests (Cyan) */}
                <div className="bg-[#E0F2F1] border border-cyan-100 rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.pendingRequests}</h3>
                        <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Pending Requests</p>
                    </div>
                    <div className="absolute right-4 top-4 text-cyan-500 bg-white p-2 rounded-full shadow-sm">
                        <Hourglass size={18} />
                    </div>
                </div>

                {/* Card 3: Total Quotations (Peach/Orange) */}
                <div className="bg-[#FFF3E0] border border-orange-100 rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.totalQuotations}</h3>
                        <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Total Quotations</p>
                    </div>
                    <div className="absolute right-4 top-4 text-orange-400 bg-white p-2 rounded-full shadow-sm">
                        <div className="w-5 h-5 flex items-center justify-center border-2 border-orange-400 rounded-full text-[10px] font-bold">=</div>
                    </div>
                </div>

                {/* Card 4: Pending Quotations (Green/Light Green) */}
                <div className="bg-[#E8F5E9] border border-green-100 rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.pendingQuotations}</h3>
                        <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Pending Quotations</p>
                    </div>
                    <div className="absolute right-4 top-4 text-green-500 bg-white p-2 rounded-full shadow-sm">
                        <Hourglass size={18} />
                    </div>
                </div>

                {/* Card 5: Accepted Quotations (Pink) */}
                <div className="bg-[#FCE4EC] border border-pink-100 rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.acceptedQuotations}</h3>
                        <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Accepted Quotations</p>
                    </div>
                    <div className="absolute right-4 top-4 text-pink-400 bg-white p-2 rounded-full shadow-sm">
                        <CheckCircle size={18} />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">

                {/* Filters */}
                <div className="flex flex-col sm:flex-row justify-end gap-4 mb-6 relative">
                    {statusFilter && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-red-500 hover:text-red-700 font-medium self-end sm:self-auto min-h-[44px] flex items-center"
                        >
                            Clear Filters
                        </button>
                    )}
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap min-h-[44px]">
                            <span className="opacity-70">Date</span>
                            <ChevronDown size={14} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap min-h-[44px]">
                            <span className="opacity-70">Delivery Type</span>
                            <ChevronDown size={14} />
                        </button>

                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowStatusMenu(!showStatusMenu);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors whitespace-nowrap min-h-[44px] ${statusFilter ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                            >
                                <span className="opacity-70">{statusFilter ? getStatusLabel(statusFilter) : 'Status'}</span>
                                <ChevronDown size={14} />
                            </button>

                            {/* Status Dropdown */}
                            {showStatusMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                    <button
                                        onClick={() => handleStatusSelect('request_sent')}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 min-h-[44px]"
                                    >
                                        New
                                    </button>
                                    <button
                                        onClick={() => handleStatusSelect('cost_calculated')}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 min-h-[44px]"
                                    >
                                        Pending
                                    </button>
                                    <button
                                        onClick={() => handleStatusSelect('ready_for_pickup')}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 min-h-[44px]"
                                    >
                                        Accepted
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto shadow-sm rounded-lg border border-gray-100">
                    <table className="min-w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F1F5F9] text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <th className="px-4 py-4 whitespace-nowrap">SI No.</th>
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
                            ) : quotations.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="px-4 py-8 text-center text-slate-400">No records found</td>
                                </tr>
                            ) : (
                                quotations.map((row, index) => (
                                    <tr key={row._id || row.id || index} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-4 py-4 text-slate-400 whitespace-nowrap">
                                            #{String((currentPage - 1) * itemsPerPage + index + 1).padStart(3, '0')}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-slate-700 whitespace-nowrap" title={typeof row.clientId === 'object' && row.clientId !== null && 'fullName' in row.clientId ? (row.clientId as any).fullName : 'Unknown'}>
                                            <div className="truncate max-w-[150px]">
                                                {typeof row.clientId === 'object' && row.clientId !== null && 'fullName' in row.clientId
                                                    ? (row.clientId as any).fullName
                                                    : 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{row.origin?.city || '-'}</td>
                                        <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">
                                            {typeof row.clientId === 'object' && row.clientId !== null && 'phone' in row.clientId
                                                ? (row.clientId as any).phone
                                                : row.origin?.phone || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">{row.serviceType || 'Standard'}</td>
                                        <td className="px-4 py-4 text-center whitespace-nowrap">{row.items?.reduce((a, b) => a + (b.quantity || 0), 0) || 0}</td>
                                        <td className="px-4 py-4 text-center whitespace-nowrap">{'-'}</td>
                                        <td className="px-4 py-4 text-center whitespace-nowrap">{'-'}</td>
                                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{row.destination?.city || '-'}</td>
                                        <td className="px-4 py-4 text-xs whitespace-nowrap">{row.quotationId?.split('-').pop() || row.quotationNumber?.slice(-6) || 'N/A'}</td>
                                        <td className="px-4 py-4 text-xs whitespace-nowrap">{row.validUntil ? formatDate(row.validUntil) : '-'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={getStatusStyle(row.status)}>
                                                {getStatusLabel(row.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 relative whitespace-nowrap">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRequestId(row._id || row.id);
                                                }}
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

            {/* Request Details Modal */}
            {selectedRequestId && (
                <RequestDetailsModal
                    requestId={selectedRequestId}
                    onClose={() => setSelectedRequestId(null)}
                    onStatusChange={() => {
                        fetchData(currentPage, statusFilter);
                        setSelectedRequestId(null);
                    }}
                />
            )}
        </div>
    );
}
