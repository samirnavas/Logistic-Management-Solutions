'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './dashboard-layout.module.css';

// Generic Icon Component
const Icon = ({ path }: { path: string }) => (
    <svg className={styles.icon} viewBox="0 0 24 24">
        <path d={path} />
    </svg>
);

const Icons = {
    Dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    Requests: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
    Quotations: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    Deliveries: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M18.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
    Users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    Settings: "M12.22 2h-.44a2 2 0 0 1-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    Search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35",
    Bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0"
};

const MENU_ITEMS = [
    { name: 'Dashboard', path: '/', icon: Icons.Dashboard },
    { name: 'Quotation Requests', path: '/requests', icon: Icons.Requests },
    { name: 'Quotations', path: '/quotations', icon: Icons.Quotations },
    { name: 'Deliveries', path: '/deliveries', icon: Icons.Deliveries }, // Might need to be 'Shipments'
    { name: 'Customers', path: '/users', icon: Icons.Users },
    // { name: 'Reports', path: '/reports', icon: Icons.Requests }, 
    // { name: 'Settings', path: '/settings', icon: Icons.Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<{ fullName: string, role: string } | null>(null);

    useEffect(() => {
        // Auth Check
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/login');
            return;
        }

        try {
            setUser(JSON.parse(userStr));
        } catch (e) {
            router.push('/login');
        }
    }, [router]);

    if (!user) return null; // Or generic loading spinner

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <div>
                        <h2>B&B</h2>
                        <span>INTERNATIONAL</span>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
                            >
                                <Icon path={item.icon} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className={styles.mainWrapper}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.searchBar}>
                        <Icon path={Icons.Search} />
                        <input
                            type="text"
                            placeholder="Search here..."
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.headerActions}>
                        <button title="Notifications">
                            <Icon path={Icons.Bell} />
                        </button>
                        <div className={styles.userProfile}>
                            <div className={styles.avatar}>
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            {/* Could show name, dropdown, etc */}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
