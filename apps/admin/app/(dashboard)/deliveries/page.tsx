'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '../../components/StatusBadge';

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
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold text-foreground">Deliveries</h1>

            <div className="bg-card rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-border overflow-hidden">
                <div className="overflow-x-auto p-4 md:p-6">
                    <table className="w-full text-left text-sm text-muted-foreground border-collapse">
                        <thead className="bg-muted text-xs uppercase font-bold text-muted-foreground tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Tracking ID</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Origin</th>
                                <th className="px-6 py-4">Destination</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
                            ) : shipments.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No deliveries found.</td></tr>
                            ) : (
                                shipments.map((shipment) => (
                                    <tr key={shipment._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-sky-700">{shipment.trackingId || shipment._id}</td>
                                        <td className="px-6 py-4 text-zinc-800">{shipment.clientId?.fullName}</td>
                                        <td className="px-6 py-4">{shipment.origin?.city}</td>
                                        <td className="px-6 py-4">{shipment.destination?.city}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={shipment.status} />
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">{new Date(shipment.createdAt).toLocaleDateString()}</td>
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
