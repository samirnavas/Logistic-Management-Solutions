'use client';

import { useEffect, useState } from 'react';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    // Filter client apps
                    setUsers(data.filter((u: any) => u.role === 'client app'));
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined Date</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No users found.</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-zinc-800 font-medium">{user.fullName}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{user.customerCode || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                                ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
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
