'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Image from 'next/image';

export default function LoginPage() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [params, setParams] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setParams({ ...params, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                // Registration Logic
                if (params.password !== params.confirmPassword) {
                    throw new Error("Passwords do not match");
                }

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: params.fullName,
                        email: params.email,
                        password: params.password,
                        phone: params.phone,
                        role: 'admin' // Force admin role as requested
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Registration failed');

                // Auto-login or just switch to login? 
                // Let's store token and redirect directly if backend returns token (it typically does)
                if (data.token) {
                    // Registration successful - but per user request, we guide them to login manually.
                    // This ensures the flow "Go to Login" is respected.
                    setIsRegistering(false);
                    setError(''); // Clear any errors
                    alert('Registration successful! Please log in with your new credentials.');
                } else {
                    setIsRegistering(false);
                    alert('Registration successful! Please log in.');
                }

            } else {
                // Login Logic
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: params.email, password: params.password }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Login failed');

                if (data.user.role === 'client app' && data.user.role !== 'admin' && data.user.role !== 'manager') {
                    // throw new Error('Unauthorized access'); // Optionally strict check, but keeping loose for now
                }

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left Side - Image/Hero */}
            <div className="hidden lg:flex flex-1 relative bg-muted items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/50 z-10 flex flex-col justify-end p-12 text-white">
                    <div className="mb-4">
                        <h1 className="text-5xl font-bold leading-tight">Manage Requests.<br />Send Quotations.<br />Deliver Faster.</h1>
                    </div>
                </div>
                <div className="absolute inset-0 z-0 bg-cover bg-center" style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop")',
                }} />
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-full lg:max-w-xl">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-primary">B&B<br /><span className="text-sm text-emerald-500">INTERNATIONAL</span></h2>
                        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">{isRegistering ? 'Create Admin Account' : 'Log In'}</h2>
                    </div>

                    {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">{error}</div>}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {isRegistering && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="fullName">Full Name</label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="John Doe"
                                        value={params.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none" htmlFor="phone">Phone Number</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        placeholder="+1 234 567 890"
                                        value={params.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="email">{isRegistering ? 'Email Address' : 'User Name / Email'}</label>
                            <input
                                id="email"
                                type="email"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="email@example.com"
                                value={params.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Password"
                                value={params.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {isRegistering && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Confirm Password"
                                    value={params.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                            {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Sign In')}
                        </button>

                        <div className="text-center text-sm text-muted-foreground mt-4">
                            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                            <span className="ml-1 font-semibold text-primary cursor-pointer hover:underline" onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>
                                {isRegistering ? ' Login' : ' Create Account'}
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
