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
    BarChart3,
    Menu,
    X,
    Building // Icon for Warehouses
} from 'lucide-react';

const MENU_ITEMS = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Quotation Requests', path: '/requests', icon: FileText },
    { name: 'Quotations', path: '/quotations', icon: Package },
    { name: 'Deliveries', path: '/deliveries', icon: Truck },
    { name: 'Customers', path: '/users', icon: Users },
    { name: 'Warehouses', path: '/warehouses', icon: Building },
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
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [pathname]);

    if (!user) return null;

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* --- Mobile Sidebar Overlay (Backdrop) --- */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* --- Sidebar --- */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-card flex-col transition-transform duration-300 ease-in-out shadow-[1px_0_15px_rgba(0,0,0,0.03)] border-r-0
                md:relative md:translate-x-0 md:flex
                ${isMobileSidebarOpen ? 'translate-x-0 flex' : '-translate-x-full hidden md:flex'}
            `}>
                <div className="h-20 flex items-center justify-between px-6 border-b border-border/50 relative">
                    <div className="flex items-center justify-center w-full md:w-auto mt-2">
                        <Image
                            src="/bb_logo.png"
                            alt="B&B International"
                            width={350}
                            height={140}
                            className="w-auto h-16 object-contain"
                            priority
                        />
                    </div>
                    {/* Close Button Mobile */}
                    <button
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="md:hidden text-muted-foreground hover:text-foreground absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-primary/10 text-primary font-medium shadow-sm'
                                    : 'text-muted-foreground hover:bg-secondary/10 hover:text-foreground'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-primary' : ''} />
                                <span className="text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* --- Main Content --- */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Header */}
                <header className="h-20 bg-card border-b-0 shadow-[0_1px_15px_rgba(0,0,0,0.03)] flex items-center justify-between px-4 md:px-8 z-10 relative">

                    <div className="flex items-center gap-4 flex-1">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="md:hidden text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Search Bar (Left) */}
                        <div className="relative w-full max-w-sm hidden sm:block">
                            <div className="absolute left-3 top-2.5 text-muted-foreground">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search here..."
                                className="w-full pl-10 pr-4 py-2 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background/50 transition-all placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center gap-2 md:gap-4 ml-4">
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary/10 transition-colors">
                            <Bell size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full overflow-hidden border border-primary/20 flex items-center justify-center text-primary font-bold">
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
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
