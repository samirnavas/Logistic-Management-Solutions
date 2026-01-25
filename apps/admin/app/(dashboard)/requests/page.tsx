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
            <h1 className="text-2xl font-semibold text-foreground">Quotation Requests</h1>

            <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">SI No.</th>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Location</th>
                                <th className="px-4 py-3 text-left font-medium">Destination</th>
                                <th className="px-4 py-3 text-left font-medium">Request #</th>
                                <th className="px-4 py-3 text-left font-medium">Date</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No new requests found.</td></tr>
                            ) : (
                                requests.map((req, index) => (
                                    <tr key={req._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3">#{String(index + 1).padStart(3, '0')}</td>
                                        <td className="px-4 py-3 text-foreground">{req.clientId?.fullName}</td>
                                        <td className="px-4 py-3 text-foreground">{req.origin?.city}</td>
                                        <td className="px-4 py-3 text-foreground">{req.destination?.city}</td>
                                        <td className="px-4 py-3">{req.quotationId}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">New</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/requests/${req._id}`} className="text-primary font-medium hover:text-primary/80 text-sm">View</Link>
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
