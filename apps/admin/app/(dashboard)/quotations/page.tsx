'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../dashboard.module.css';

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
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>All Quotations</h1>

            <div className={styles.tableSection}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Client</th>
                                <th>Destination</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7}>Loading...</td></tr>
                            ) : quotations.length === 0 ? (
                                <tr><td colSpan={7}>No quotations found.</td></tr>
                            ) : (
                                quotations.map((q) => (
                                    <tr key={q._id}>
                                        <td>{q.quotationId}</td>
                                        <td>{q.clientId?.fullName}</td>
                                        <td>{q.destination?.city}</td>
                                        <td>{q.currency} {q.totalAmount?.toLocaleString()}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${q.status === 'Accepted' ? styles.statusAccepted :
                                                q.status === 'Rejected' ? styles.statusRejected :
                                                    styles.statusPending
                                                }`}>
                                                {q.status}
                                            </span>
                                        </td>
                                        <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <Link href={`/quotations/${q._id}`} className={styles.actionBtn}>View Details</Link>
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
