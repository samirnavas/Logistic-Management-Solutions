'use client';

import { useEffect, useState, use } from 'react'; // Added 'use'
import { useRouter } from 'next/navigation';
import styles from './request-details.module.css';

export default function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params); // Unwrap params
    const { id } = resolvedParams;
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showQuoteForm, setShowQuoteForm] = useState(false);
    const router = useRouter();

    // Quotation Form State
    const [quoteData, setQuoteData] = useState({
        price: '',
        taxRate: '10', // Default 10%
        notes: '',
        validUntil: ''
    });

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/quotations/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRequest(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [id]);

    const handleCreateQuotation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // We are updating the existing quotation (which was in 'request_sent' status)
            // to add price and change status to 'Approved' (since Manager creates it, it's effectively approved/sent)

            const payload = {
                items: [{
                    description: 'Freight Charges',
                    amount: Number(quoteData.price)
                }],
                taxRate: Number(quoteData.taxRate),
                validUntil: quoteData.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
                internalNotes: quoteData.notes,
                // Status should be updated by backend or explicitly set
                // The endpoint PUT /:id updates it.
                // We also need to approve it.
            };

            // 1. Update the quotation details
            const updateRes = await fetch(`/api/quotations/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!updateRes.ok) throw new Error('Failed to update quotation details');

            // 2. Approve it (this sets status to 'Approved')
            const approveRes = await fetch(`/api/quotations/${id}/approve`, {
                method: 'PATCH', // It's PATCH in routes
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!approveRes.ok) throw new Error('Failed to approve quotation');

            // 3. Send it (sets status to 'Sent')
            const sendRes = await fetch(`/api/quotations/${id}/send`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!sendRes.ok) throw new Error('Failed to send quotation');

            setShowQuoteForm(false);
            router.push('/quotations');

        } catch (err) {
            console.error(err);
            alert('Error creating quotation');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!request) return <div className="p-8">Request not found</div>;

    return (
        <div className={styles.detailsContainer}>
            <div className={styles.header}>
                <div>
                    <span className={styles.label}>Request ID</span>
                    <h1>{request.quotationId}</h1>
                </div>
                <div className={styles.statusTag}>{request.status}</div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Customer Information</h2>
                <div className={styles.grid}>
                    <div className={styles.field}>
                        <span className={styles.label}>Name</span>
                        <div className={styles.value}>{request.clientId?.fullName}</div>
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label}>Email</span>
                        <div className={styles.value}>{request.clientId?.email}</div>
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label}>Customer Code</span>
                        <div className={styles.value}>{request.clientId?.customerCode || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Delivery Details</h2>
                <div className={styles.grid}>
                    <div className={styles.field}>
                        <span className={styles.label}>Origin</span>
                        <div className={styles.value}>{request.origin?.city}, {request.origin?.country}</div>
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label}>Destination</span>
                        <div className={styles.value}>{request.destination?.city}, {request.destination?.country}</div>
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label}>Cargo Type</span>
                        <div className={styles.value}>{request.cargoType}</div>
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label}>Service Type</span>
                        <div className={styles.value}>{request.serviceType}</div>
                    </div>
                </div>
                {/* Photos */}
                {request.productPhotos?.length > 0 && (
                    <div className={styles.photos}>
                        {request.productPhotos.map((photo: string, index: number) => (
                            <div key={index} className={styles.photo} style={{ backgroundImage: `url(${photo})` }} />
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                <button className={styles.btnSecondary} onClick={() => router.back()}>Back</button>
                {request.status === 'request_sent' && (
                    <button className={styles.btnPrimary} onClick={() => setShowQuoteForm(true)}>Create Quotation</button>
                )}
            </div>

            {/* Quotation Modal */}
            {showQuoteForm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2 className={styles.sectionTitle}>Create Quotation</h2>
                        <form onSubmit={handleCreateQuotation}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Base Price (Freight)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    required
                                    value={quoteData.price}
                                    onChange={(e) => setQuoteData({ ...quoteData, price: e.target.value })}
                                />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label className={styles.label}>Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={quoteData.taxRate}
                                        onChange={(e) => setQuoteData({ ...quoteData, taxRate: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label className={styles.label}>Valid Until</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={quoteData.validUntil}
                                        onChange={(e) => setQuoteData({ ...quoteData, validUntil: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Internal Notes</label>
                                <textarea
                                    className={styles.input}
                                    rows={3}
                                    value={quoteData.notes}
                                    onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                                />
                            </div>
                            <div className={styles.actions}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setShowQuoteForm(false)}>Cancel</button>
                                <button type="submit" className={styles.btnPrimary}>Send Quotation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
