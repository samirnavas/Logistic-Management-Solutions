'use client';

import { useEffect, useState } from 'react';

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
            <h1 className="text-2xl font-semibold text-zinc-800">Deliveries</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
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
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                                ${shipment.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                    shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'}`}>
                                                {shipment.status}
                                            </span>
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
