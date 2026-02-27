'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '../../components/StatusBadge';
import TableSkeleton from '../../components/TableSkeleton';
import TableEmptyState from '../../components/TableEmptyState';

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

            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 border-collapse">
                        <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 tracking-wider">
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
                                <TableSkeleton columns={6} />
                            ) : shipments.length === 0 ? (
                                <TableEmptyState
                                    colSpan={6}
                                    title="No deliveries found"
                                    description="No active deliveries tracked in the system yet."
                                />
                            ) : (
                                shipments.map((shipment) => (
                                    <tr key={shipment._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-sky-700">{shipment.trackingId || shipment._id}</td>
                                        <td className="px-6 py-4 text-gray-800">{shipment.clientId?.fullName}</td>
                                        <td className="px-6 py-4">{shipment.origin?.city}</td>
                                        <td className="px-6 py-4">{shipment.destination?.city}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={shipment.status} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(shipment.createdAt).toLocaleDateString()}</td>
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
