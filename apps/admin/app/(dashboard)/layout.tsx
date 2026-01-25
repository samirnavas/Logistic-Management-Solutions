'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Package,
    Truck,
    Users,
    Settings,
    Search,
    Bell,
    Menu,
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

    // Determine Page Title
    const currentItem = MENU_ITEMS.find(item => item.path === pathname) ||
        MENU_ITEMS.find(item => item.path !== '/' && pathname.startsWith(item.path));
    const pageTitle = currentItem ? currentItem.name : 'Dashboard';

    if (!user) return null;

    return (
        <div className="flex h-screen bg-neutral-100 font-sans text-slate-800">
            {/* --- Sidebar --- */}
            <aside className="w-64 bg-white flex-shrink-0 border-r border-gray-200 hidden md:flex flex-col">
                <div className="h-20 flex items-center px-8 border-b border-gray-100">
                    <span className="text-xl font-bold text-sky-700">LOGISTICS</span>
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
                    <h1 className="text-2xl font-semibold text-zinc-800">{pageTitle}</h1>
                    <div className="flex items-center gap-4">
                        {/* Search Placeholder */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search here..."
                                className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                            />
                            <div className="absolute right-3 top-2.5 text-gray-400">
                                <Search size={16} />
                            </div>
                        </div>
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100">
                            <Bell size={20} />
                        </button>
                        <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-bold border border-sky-200">
                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
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
