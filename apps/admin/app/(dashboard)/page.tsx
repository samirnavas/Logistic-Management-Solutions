'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface StatCardProps {
    label: string;
    value: string | number;
    iconColor: string;
    iconBg: string;
}

const StatCard = ({ label, value, iconColor, iconBg }: StatCardProps) => (
    <div className={styles.statCard}>
        <div>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
        </div>
        <div className={styles.statIcon} style={{ backgroundColor: iconBg, color: iconColor }}>
            {/* Icon placeholder */}
            <span>📊</span>
        </div>
    </div>
);

export default function DashboardPage() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        totalQuotations: 0,
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

                    // The API returns { quotations: [], pagination: {} }
                    // So we must access .quotations
                    const data = responseData.quotations || [];

                    setQuotations(data);

                    // Calculate stats
                    const totalReq = data.length;
                    const newReq = data.filter((q: any) => q.status === 'request_sent').length;
                    const quotes = data.filter((q: any) => q.status !== 'request_sent').length; // Assuming anything handled is a "Quotation"
                    const accepted = data.filter((q: any) => q.status === 'Accepted').length;

                    setStats({
                        totalRequests: totalReq,
                        pendingRequests: newReq,
                        totalQuotations: quotes,
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
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Dashboard</h1>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard
                    value={stats.totalRequests}
                    label="Total Quotation Requests"
                    iconBg="#e0f2fe"
                    iconColor="#0284c7"
                />
                <StatCard
                    value={stats.pendingRequests}
                    label="Pending Requests"
                    iconBg="#dcfce7"
                    iconColor="#16a34a"
                />
                <StatCard
                    value={stats.totalQuotations}
                    label="Total Quotations"
                    iconBg="#fef3c7"
                    iconColor="#d97706"
                />
                <StatCard
                    value={stats.acceptedQuotations}
                    label="Accepted Quotations"
                    iconBg="#fce7f3"
                    iconColor="#db2777"
                />
            </div>

            {/* Recent Requests Table */}
            <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                    <div className={styles.filterControls}>
                        {/* Filters can be added here */}
                        <select className={styles.select}>
                            <option>Date</option>
                        </select>
                        <select className={styles.select}>
                            <option>Status</option>
                        </select>
                    </div>

                    <Link href="/requests" className={styles.actionBtn}>View New Requests</Link>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Destination</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading...</td></tr>
                            ) : quotations.slice(0, 5).map((q: any) => (
                                <tr key={q._id}>
                                    <td>{q.quotationId || q.quotationNumber?.slice(-6) || 'N/A'}</td>
                                    <td>{q.clientId?.fullName || 'Unknown'}</td>
                                    <td>{q.destination?.city || 'N/A'}</td>
                                    <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${q.status === 'request_sent' ? styles.statusNew :
                                            q.status === 'Accepted' ? styles.statusAccepted :
                                                styles.statusPending
                                            }`}>
                                            {q.status === 'request_sent' ? 'New' : q.status}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/${q.status === 'request_sent' ? 'requests' : 'quotations'}/${q._id}`} className={styles.actionBtn}>
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
