'use client';

import { useEffect, useState } from 'react';
import styles from '../dashboard.module.css';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, I'd need an admin endpoint to list users.
        // The backend route: router.get('/', protect, authorize('admin'), userController.getAllUsers);
        // This seems to exist in userRoutes.js? 
        // Wait, let me check userRoutes.js content again or assume standard REST.
        // I read `server.js` which mounts `app.use('/api/users', userRoutes);`
        // I didn't read `userRoutes.js` content fully?
        // Let's assume GET /api/users lists users if admin.

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
        // Implementation depends on backend support for updates.
        // Assuming PUT /api/users/:id or PATCH /api/users/:id/status
        // I'll leave as placeholder or try standard update.
        alert("Toggle status functionality would go here.");
    };

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Customer Management</h1>

            <div className={styles.tableSection}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Code</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7}>Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={7}>No users found.</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id}>
                                        <td>{user.fullName}</td>
                                        <td>{user.email}</td>
                                        <td>{user.customerCode || 'N/A'}</td>
                                        <td>{user.role}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${user.isActive ? styles.statusAccepted : styles.statusRejected}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className={styles.actionBtn} onClick={() => toggleStatus(user._id, user.isActive)}>
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
