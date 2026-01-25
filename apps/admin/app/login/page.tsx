'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './login.module.css';

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
        <div className={styles.container}>
            {/* Left Side - Image/Hero */}
            <div className={styles.imageSection}>
                <div className={styles.imageOverlay}>
                    <div className={styles.heroText}>
                        <h1>Manage Requests.<br />Send Quotations.<br />Deliver Faster.</h1>
                    </div>
                </div>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 1
                }} />
            </div>

            {/* Right Side - Form */}
            <div className={styles.formSection}>
                <div className={styles.loginCard}>
                    <div className={styles.logo}>
                        <h2 style={{ color: '#0056b3', fontWeight: 'bold', fontSize: '1.5rem' }}>B&B<br /><span style={{ fontSize: '0.8rem', color: '#10b981' }}>INTERNATIONAL</span></h2>
                    </div>

                    <h2 className={styles.title}>{isRegistering ? 'Create Admin Account' : 'Log In'}</h2>

                    {error && <div className={styles.error}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {isRegistering && (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.label} htmlFor="fullName">Full Name</label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        className={styles.input}
                                        placeholder="John Doe"
                                        value={params.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label} htmlFor="phone">Phone Number</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        className={styles.input}
                                        placeholder="+1 234 567 890"
                                        value={params.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="email">{isRegistering ? 'Email Address' : 'User Name / Email'}</label>
                            <input
                                id="email"
                                type="email"
                                className={styles.input}
                                placeholder="email@example.com"
                                value={params.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className={styles.input}
                                placeholder="Password"
                                value={params.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {isRegistering && (
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    className={styles.input}
                                    placeholder="Confirm Password"
                                    value={params.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Sign In')}
                        </button>

                        <div className={styles.toggleText}>
                            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                            <span className={styles.toggleLink} onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>
                                {isRegistering ? ' Login' : ' Create Account'}
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
