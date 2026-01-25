'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
    Hourglass,
    CheckCircle,
    MoreHorizontal,
    ChevronDown,
} from 'lucide-react';

export default function DashboardPage() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        totalQuotations: 0,
        pendingQuotations: 0,
        acceptedQuotations: 0,
    });
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Matching screenshot roughly

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/quotations', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const responseData = await res.json();
                    const data = responseData.quotations || [];

                    setQuotations(data);

                    // Calculate stats logic
                    const totalReq = data.length;
                    const pendingReq = data.filter((q: any) => q.status === 'request_sent').length;
                    const totalQuot = data.filter((q: any) => q.status !== 'request_sent').length;
                    const pendingQuot = data.filter((q: any) =>
                        ['cost_calculated', 'Pending Approval', 'Sent'].includes(q.status)
                    ).length;
                    const acceptedQuot = data.filter((q: any) =>
                        ['Accepted', 'ready_for_pickup', 'shipped', 'delivered'].includes(q.status)
                    ).length;

                    setStats({
                        totalRequests: totalReq,
                        pendingRequests: pendingReq,
                        totalQuotations: totalQuot,
                        pendingQuotations: pendingQuot,
                        acceptedQuotations: acceptedQuot
                    });
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDate = (dateString: string) => {
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
        if (s === 'pending' || s === 'cost_calculated' || s === 'sent') return 'text-orange-500 font-medium';
        if (s === 'accepted' || s === 'ready_for_pickup') return 'text-green-600 font-medium';
        if (s === 'rejected') return 'text-red-600 font-medium';
        return 'text-gray-600';
    };

    const getStatusLabel = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'request_sent') return 'New';
        if (s === 'cost_calculated') return 'Pending';
        if (s === 'ready_for_pickup') return 'Accepted';
        if (s === 'sent') return 'Pending';
        return status;
    };

    // Client-side Pagination Logic
    const totalPages = Math.ceil(quotations.length / itemsPerPage);
    const paginatedQuotations = quotations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        // If total pages <= 7, show all
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Logic to show ranges like 1 2 3 ... 67 68
            // Simplified for now: Show current, prev, next, first, last
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
                <h1 className="text-3xl font-semibold text-zinc-800">Dashboard</h1>
                <Link
                    href="/requests"
                    className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm text-sm"
                >
                    View New Requests
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Card 1: Total Quotation Requests (Blue) */}
                <div className="bg-[#EBF5FF] border border-blue-100 rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.totalRequests}</h3>
                        <p className="text-sm text-slate-500 font-medium">Total Quotation Requests</p>
                    </div>
                    <div className="absolute right-4 top-4 text-blue-400 bg-white p-2 rounded-full shadow-sm">
                        <div className="w-5 h-5 flex items-center justify-center border-2 border-blue-400 rounded-full text-[10px] font-bold">=</div>
                    </div>
                </div>

                {/* Card 2: Pending Requests (Cyan) */}
                <div className="bg-[#E0F2F1] border border-cyan-100 rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.pendingRequests}</h3>
                        <p className="text-sm text-slate-500 font-medium">Pending Requests</p>
                    </div>
                    <div className="absolute right-4 top-4 text-cyan-500 bg-white p-2 rounded-full shadow-sm">
                        <Hourglass size={18} />
                    </div>
                </div>

                {/* Card 3: Total Quotations (Peach/Orange) */}
                <div className="bg-[#FFF3E0] border border-orange-100 rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.totalQuotations}</h3>
                        <p className="text-sm text-slate-500 font-medium">Total Quotations</p>
                    </div>
                    <div className="absolute right-4 top-4 text-orange-400 bg-white p-2 rounded-full shadow-sm">
                        <div className="w-5 h-5 flex items-center justify-center border-2 border-orange-400 rounded-full text-[10px] font-bold">=</div>
                    </div>
                </div>

                {/* Card 4: Pending Quotations (Green/Light Green) */}
                <div className="bg-[#E8F5E9] border border-green-100 rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.pendingQuotations}</h3>
                        <p className="text-sm text-slate-500 font-medium">Pending Quotations</p>
                    </div>
                    <div className="absolute right-4 top-4 text-green-500 bg-white p-2 rounded-full shadow-sm">
                        <Hourglass size={18} />
                    </div>
                </div>

                {/* Card 5: Accepted Quotations (Pink) */}
                <div className="bg-[#FCE4EC] border border-pink-100 rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.acceptedQuotations}</h3>
                        <p className="text-sm text-slate-500 font-medium">Accepted Quotations</p>
                    </div>
                    <div className="absolute right-4 top-4 text-pink-400 bg-white p-2 rounded-full shadow-sm">
                        <CheckCircle size={18} />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

                {/* Filters */}
                <div className="flex justify-end gap-4 mb-6">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                        <span className="opacity-70">Date</span>
                        <ChevronDown size={14} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                        <span className="opacity-70">Delivery Type</span>
                        <ChevronDown size={14} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                        <span className="opacity-70">Status</span>
                        <ChevronDown size={14} />
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F1F5F9] text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <th className="px-4 py-4 rounded-l-lg">SI No.</th>
                                <th className="px-4 py-4">Name</th>
                                <th className="px-4 py-4">Location</th>
                                <th className="px-4 py-4">Contact</th>
                                <th className="px-4 py-4">Delivery Type</th>
                                <th className="px-4 py-4">#Boxes</th>
                                <th className="px-4 py-4">CBM</th>
                                <th className="px-4 py-4">Weight</th>
                                <th className="px-4 py-4">Destination</th>
                                <th className="px-4 py-4">Request#</th>
                                <th className="px-4 py-4">Expiry#</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4 rounded-r-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-600">
                            {loading ? (
                                <tr>
                                    <td colSpan={13} className="px-4 py-8 text-center text-slate-400">Loading data...</td>
                                </tr>
                            ) : paginatedQuotations.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="px-4 py-8 text-center text-slate-400">No records found</td>
                                </tr>
                            ) : (
                                paginatedQuotations.map((row, index) => (
                                    <tr key={row._id || index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                                        <td className="px-4 py-4 text-slate-400">
                                            #{String((currentPage - 1) * itemsPerPage + index + 1).padStart(3, '0')}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-slate-700">{row.clientId?.fullName || 'Unknown'}</td>
                                        <td className="px-4 py-4 text-slate-500">{row.origin?.city || '-'}</td>
                                        <td className="px-4 py-4 text-slate-500 text-xs">{row.origin?.phone || row.clientId?.phone || '-'}</td>
                                        <td className="px-4 py-4 text-slate-500 text-xs">{row.serviceType || 'Standard'}</td>
                                        <td className="px-4 py-4 text-center">{row.items?.reduce((a: number, b: any) => a + (b.quantity || 0), 0) || 0}</td>
                                        <td className="px-4 py-4 text-center">{row.cbm || '-'}</td>
                                        <td className="px-4 py-4 text-center">{row.weight || '-'}</td>
                                        <td className="px-4 py-4 text-slate-500">{row.destination?.city || '-'}</td>
                                        <td className="px-4 py-4 text-xs">{row.quotationId?.split('-').pop() || row.quotationNumber?.slice(-6) || 'N/A'}</td>
                                        <td className="px-4 py-4 text-xs whitespace-nowrap">{row.validUntil ? formatDate(row.validUntil) : '-'}</td>
                                        <td className="px-4 py-4">
                                            <span className={getStatusStyle(row.status)}>
                                                {getStatusLabel(row.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === row._id ? null : row._id);
                                                }}
                                                className="text-gray-300 hover:text-blue-600 p-1 rounded-full transition-colors"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {openMenuId === row._id && (
                                                <div
                                                    ref={menuRef}
                                                    className="absolute right-8 top-8 z-50 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-in fade-in zoom-in duration-200"
                                                >
                                                    <Link
                                                        href={`/${row.status === 'request_sent' ? 'requests' : 'quotations'}/${row._id}`}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                                    >
                                                        View
                                                    </Link>
                                                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                                                        Edit
                                                    </button>
                                                    <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
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
                                onClick={() => typeof page === 'number' && setCurrentPage(page)}
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
        </div>
    );
}
