'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/quotations', { // In real app, might filter on server
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const responseData = await res.json();
                    const data = responseData.quotations || [];

                    // Filter for 'request_sent' status (New Requests)
                    const newRequests = data.filter((q: any) => q.status === 'request_sent');
                    setRequests(newRequests);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-semibold text-zinc-800">Quotation Requests</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">SI No.</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Destination</th>
                                <th className="px-6 py-4">Request #</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-8 text-center text-zinc-500">No new requests found.</td></tr>
                            ) : (
                                requests.map((req, index) => (
                                    <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-sky-700">#{String(index + 1).padStart(3, '0')}</td>
                                        <td className="px-6 py-4 text-zinc-800 font-medium">{req.clientId?.fullName}</td>
                                        <td className="px-6 py-4">{req.origin?.city}</td>
                                        <td className="px-6 py-4">{req.destination?.city}</td>
                                        <td className="px-6 py-4 text-xs font-mono">{req.quotationId}</td>
                                        <td className="px-6 py-4 text-zinc-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">New</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/requests/${req._id}`} className="text-gray-400 hover:text-sky-700 transition-colors">View</Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
