'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function QuotationsPage() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            <h1 className="text-2xl font-semibold text-foreground">All Quotations</h1>

            <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">ID</th>
                                <th className="px-4 py-3 text-left font-medium">Client</th>
                                <th className="px-4 py-3 text-left font-medium">Destination</th>
                                <th className="px-4 py-3 text-left font-medium">Total Amount</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Date</th>
                                <th className="px-4 py-3 text-left font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                            ) : quotations.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No quotations found.</td></tr>
                            ) : (
                                quotations.map((q) => (
                                    <tr key={q._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3">{q.quotationId}</td>
                                        <td className="px-4 py-3 text-foreground">{q.clientId?.fullName}</td>
                                        <td className="px-4 py-3 text-foreground">{q.destination?.city}</td>
                                        <td className="px-4 py-3 text-foreground">{q.currency} {q.totalAmount?.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                                ${q.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                                    q.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-amber-100 text-amber-800'
                                                }`}>
                                                {q.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <Link href={`/quotations/${q._id}`} className="text-primary font-medium hover:text-primary/80 text-sm">View Details</Link>
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
