'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '../../components/StatusBadge';
import TableSkeleton from '../../components/TableSkeleton';
import TableEmptyState from '../../components/TableEmptyState';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/users?role=client app', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    // Access users array from response object
                    setUsers(data.users || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const toggleStatus = async (userId: string, currentStatus: boolean) => {
        // Implementation placeholder
        alert("Toggle status functionality would go here.");
    };

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-semibold text-zinc-800">Customers</h1>

            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 border-collapse">
                        <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Customer ID</th>
                                <th className="px-6 py-4">Contact No</th>
                                <th className="px-6 py-4">Place</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <TableSkeleton columns={6} />
                            ) : users.length === 0 ? (
                                <TableEmptyState
                                    colSpan={6}
                                    title="No customers yet"
                                    description="Customers will appear here when they register on the client app."
                                />
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-zinc-800 font-medium">{user.fullName}</span>
                                                <span className="text-zinc-400 text-xs">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs font-medium text-slate-600">
                                            {user.customerCode || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {user.phone || user.savedAddresses?.find((a: any) => a.isDefault)?.contactPhone || user.savedAddresses?.[0]?.contactPhone || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {user.location || user.country || user.savedAddresses?.find((a: any) => a.isDefault)?.city || user.savedAddresses?.[0]?.city || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                className="text-sky-700 hover:underline text-sm font-medium"
                                                onClick={() => toggleStatus(user._id, user.isActive)}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
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
