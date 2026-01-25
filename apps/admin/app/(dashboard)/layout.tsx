'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    LayoutDashboard,
    FileText,
    Package,
    Truck,
    Users,
    Settings,
    Search,
    Bell,
    BarChart3
} from 'lucide-react';

const MENU_ITEMS = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Quotation Requests', path: '/requests', icon: FileText },
    { name: 'Quotations', path: '/quotations', icon: Package },
    { name: 'Deliveries', path: '/deliveries', icon: Truck },
    { name: 'Customers', path: '/users', icon: Users },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings & Roles', path: '/settings', icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<{ fullName: string, role: string, avatarUrl?: string } | null>(null);

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

    if (!user) return null;

    return (
        <div className="flex h-screen bg-neutral-100 font-sans text-slate-800">
            {/* --- Sidebar --- */}
            <aside className="w-64 bg-white flex-shrink-0 border-r border-gray-200 hidden md:flex flex-col">
                <div className="h-24 flex items-center justify-center border-b border-gray-100">
                    <Image
                        src="/bb_logo.png"
                        alt="B&B International"
                        width={400}
                        height={160}
                        className="w-auto h-28 object-contain"
                        priority
                    />
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-sky-700 text-white shadow-md shadow-sky-700/20'
                                    : 'text-zinc-500 hover:bg-gray-50 hover:text-zinc-800'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* --- Main Content --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    {/* Search Bar (Left) */}
                    <div className="relative w-96">
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search here..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-700/20 bg-gray-50/50"
                        />
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                            <Bell size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center bg-sky-100 text-sky-700 font-bold">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
