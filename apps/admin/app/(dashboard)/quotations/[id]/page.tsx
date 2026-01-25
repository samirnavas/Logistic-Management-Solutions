'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../requests/[id]/request-details.module.css'; // Reuse request details styles

export default function QuotationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchQuotation = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/quotations/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setQuotation(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuotation();
    }, [id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!quotation) return <div className="p-8">Quotation not found</div>;

    return (
        <div className={styles.detailsContainer}>
            <div className={styles.header}>
                <div>
                    <span className={styles.label}>Quotation ID</span>
                    <h1>{quotation.quotationId}</h1>
                    <span className={styles.label} style={{ marginTop: '0.5rem' }}>Request: {quotation.quotationNumber}</span>
                </div>
                <div className={styles.statusTag}>{quotation.status}</div>
            </div>

            {/* Financial Details */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Price Breakdown</h2>
                <div className={styles.grid}>
                    <div className={styles.field}>
                        <span className={styles.label}>Total Amount</span>
                        <div className={styles.value} style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                            {quotation.currency} {quotation.totalAmount?.toLocaleString()}
                        </div>
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label}>Subtotal</span>
                        <div className={styles.value}>{quotation.subtotal}</div>
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label}>Tax ({quotation.taxRate}%)</span>
                        <div className={styles.value}>{quotation.tax}</div>
                    </div>
                </div>
                {/* Line Items */}
                <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--bg-main)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem' }}>Description</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.9rem' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.items?.map((item: any, i: number) => (
                                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem' }}>{item.description}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Customer Information</h2>
                <div className={styles.grid}>
                    <div className={styles.field}>
                        <span className={styles.label}>Name</span>
                        <div className={styles.value}>{quotation.clientId?.fullName}</div>
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label}>Email</span>
                        <div className={styles.value}>{quotation.clientId?.email}</div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Shipment Info</h2>
                <div className={styles.grid}>
                    <div className={styles.field}>
                        <span className={styles.label}>Origin</span>
                        <div className={styles.value}>{quotation.origin?.city}, {quotation.origin?.country}</div>
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label}>Destination</span>
                        <div className={styles.value}>{quotation.destination?.city}, {quotation.destination?.country}</div>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button className={styles.btnSecondary} onClick={() => router.back()}>Back</button>
                {/* Add actions like "Edit" or "Download PDF" here */}
            </div>
        </div>
    );
}
