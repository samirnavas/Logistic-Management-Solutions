'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../dashboard.module.css'; // Reusing dashboard styles for consistency

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
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Quotation Requests</h1>

            <div className={styles.tableSection}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>SI No.</th>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Destination</th>
                                <th>Request #</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8}>Loading...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={8}>No new requests found.</td></tr>
                            ) : (
                                requests.map((req, index) => (
                                    <tr key={req._id}>
                                        <td>#{String(index + 1).padStart(3, '0')}</td>
                                        <td>{req.clientId?.fullName}</td>
                                        <td>{req.origin?.city}</td>
                                        <td>{req.destination?.city}</td>
                                        <td>{req.quotationId}</td>
                                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles.statusNew}`}>New</span>
                                        </td>
                                        <td>
                                            <Link href={`/requests/${req._id}`} className={styles.actionBtn}>View</Link>
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
