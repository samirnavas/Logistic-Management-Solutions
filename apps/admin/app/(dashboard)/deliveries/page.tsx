'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../dashboard.module.css';

export default function DeliveriesPage() {
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShipments = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/shipments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setShipments(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchShipments();
    }, []);

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Deliveries</h1>

            <div className={styles.tableSection}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Tracking ID</th>
                                <th>Client</th>
                                <th>Origin</th>
                                <th>Destination</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6}>Loading...</td></tr>
                            ) : shipments.length === 0 ? (
                                <tr><td colSpan={6}>No deliveries found.</td></tr>
                            ) : (
                                shipments.map((shipment) => (
                                    <tr key={shipment._id}>
                                        <td>{shipment.trackingId || shipment._id}</td>
                                        <td>{shipment.clientId?.fullName}</td>
                                        <td>{shipment.origin?.city}</td>
                                        <td>{shipment.destination?.city}</td>
                                        <td>
                                            <span className={styles.statusBadge}>{shipment.status}</span>
                                        </td>
                                        <td>{new Date(shipment.createdAt).toLocaleDateString()}</td>
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
