'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
        <div className="flex min-h-screen bg-white">
            {/* Left Side - Image/Hero */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 overflow-hidden">
                <Image
                    src="/login_side.png"
                    alt="Logistics Dashboard"
                    fill
                    className="object-cover opacity-80"
                    priority
                />

                {/* Gradient Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

                <div className="absolute bottom-0 left-0 w-full p-20 z-20">
                    <h1 className="text-5xl font-bold text-white leading-[1.15] drop-shadow-sm">
                        Manage Requests.<br />
                        Send Quotations.<br />
                        Deliver Faster.
                    </h1>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 w-full flex flex-col justify-center items-center p-8 lg:p-24 bg-white">
                <div className="w-full max-w-[420px] space-y-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-10">
                        <Image
                            src="/bb_logo.png"
                            alt="B&B International"
                            width={180}
                            height={80}
                            className="w-auto h-24 object-contain"
                            priority
                        />
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-3xl font-medium text-slate-700">
                            {isRegistering ? 'Create Account' : 'Log In'}
                        </h2>

                        {error && (
                            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isRegistering && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-500 ml-1" htmlFor="fullName">Full Name</label>
                                        <input
                                            id="fullName"
                                            type="text"
                                            className="w-full bg-gray-100 border-none rounded-xl px-5 py-3.5 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                            placeholder="John Doe"
                                            value={params.fullName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-500 ml-1" htmlFor="phone">Phone Number</label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            className="w-full bg-gray-100 border-none rounded-xl px-5 py-3.5 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                            placeholder="+1 234 567 890"
                                            value={params.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-500 ml-1" htmlFor="email">
                                    {isRegistering ? 'Email Address' : 'User Name'}
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className="w-full bg-gray-100 border-none rounded-xl px-5 py-3.5 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                    placeholder={isRegistering ? "email@example.com" : "User Given Name"}
                                    value={params.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-500 ml-1" htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    className="w-full bg-gray-100 border-none rounded-xl px-5 py-3.5 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                    placeholder="Password"
                                    value={params.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {isRegistering && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-500 ml-1" htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        className="w-full bg-gray-100 border-none rounded-xl px-5 py-3.5 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                                        placeholder="Confirm Password"
                                        value={params.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#0055A5] hover:bg-[#004485] text-white font-semibold py-3.5 rounded-full transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Sign In')}
                                </button>
                            </div>

                            <div className="text-center text-sm text-gray-500 mt-6">
                                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                                <button
                                    type="button"
                                    className="ml-1.5 text-[#0055A5] font-semibold hover:underline outline-none"
                                    onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                                >
                                    {isRegistering ? 'Login' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
