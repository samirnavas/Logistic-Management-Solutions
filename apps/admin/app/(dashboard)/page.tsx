'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Mock Data matching your provided image/text for fallback
const STATS_CONFIG = [
    { label: 'Pending Requests', key: 'pendingRequests', color: 'bg-blue-600' },
    { label: 'Total Quotations', key: 'totalQuotations', color: 'bg-teal-400' },
    { label: 'Pending Quotations', key: 'pendingQuotations', color: 'bg-orange-400' }, // Mapping 'cost_calculated' or similar
    { label: 'Accepted Quotations', key: 'acceptedQuotations', color: 'bg-green-400' },
];

export default function DashboardPage() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [stats, setStats] = useState({
        pendingRequests: 0,
        totalQuotations: 0,
        pendingQuotations: 0,
        acceptedQuotations: 0
    });
    const [loading, setLoading] = useState(true);

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

                    // Calculate stats
                    // Pending Requests: status 'request_sent'
                    const newReq = data.filter((q: any) => q.status === 'request_sent').length;
                    // Total Quotations: All records
                    const total = data.length;
                    // Pending Quotations: 'cost_calculated' (awaiting client action)
                    const pendingQs = data.filter((q: any) => ['cost_calculated', 'Sent', 'Pending Approval'].includes(q.status)).length;
                    // Accepted Quotations: 'Accepted'
                    const accepted = data.filter((q: any) => q.status === 'Accepted').length;

                    setStats({
                        pendingRequests: newReq,
                        totalQuotations: total,
                        pendingQuotations: pendingQs,
                        acceptedQuotations: accepted
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

    return (
        <div className="flex flex-col gap-8">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {STATS_CONFIG.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
                        <div className="text-3xl font-bold text-zinc-800">
                            {/* Dynamic Value */}
                            {/* @ts-ignore */}
                            {stats[stat.key] || 0}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${stat.color}`}></span>
                            <span className="text-sm text-zinc-500">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-zinc-800">New Requests</h2>
                    <Link href="/requests" className="text-sky-700 text-sm font-medium hover:underline">View All</Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Sl No.</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Boxes</th>
                                <th className="px-6 py-4">CBM</th>
                                <th className="px-6 py-4">Dest.</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={10} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
                            ) : quotations.slice(0, 8).map((row: any, i) => (
                                <tr key={row._id || i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-sky-700">
                                        {row.quotationId || row.quotationNumber?.slice(-6) || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-800 font-medium">
                                        {row.clientId?.fullName || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {row.serviceType || row.cargoType || 'Standard'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {row.origin?.city || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {row.origin?.phone || row.clientId?.phone || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {/* Sum quantity of items */}
                                        {row.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        - {/* CBM not available */}
                                    </td>
                                    <td className="px-6 py-4">
                                        {row.destination?.city || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium 
                        ${row.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                                                row.status === 'request_sent' ? 'bg-sky-100 text-sky-700' :
                                                    row.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-orange-100 text-orange-700'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/${row.status === 'request_sent' ? 'requests' : 'quotations'}/${row._id}`} className="text-gray-400 hover:text-sky-700 transition-colors">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
