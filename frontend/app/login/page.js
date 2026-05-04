'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/utils/api';

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ width: '56px', height: '56px', background: 'var(--accent)', borderRadius: '16px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)' }}>⚡</div>
                    <h1>Welcome Back</h1>
                    <p>Enter your credentials to access your workspace</p>
                </div>

                {error && <div style={{ color: '#ef4444', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="founder@startup.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ margin: '2.5rem 0', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    <span style={{ margin: '0 1.25rem', fontWeight: 700 }}>Secure Login</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            try {
                                const loadingToast = toast.loading('Authenticating...');
                                const res = await fetch(getApiUrl('/api/auth/google'), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ credential: credentialResponse.credential })
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message || 'Google Login failed');
                                localStorage.setItem('token', data.token);
                                localStorage.setItem('user', JSON.stringify(data.user));
                                toast.success('Welcome back!', { id: loadingToast });
                                
                                if (data.isNewUser) {
                                    router.push('/onboarding');
                                } else {
                                    router.push('/dashboard');
                                }
                            } catch (err) {
                                toast.error(err.message || 'Google Authentication failed');
                            }
                        }}
                        onError={() => toast.error('Google Auth failed')}
                        theme="filled_black"
                        shape="pill"
                    />
                </div>

                <div className="auth-link">
                    New to Beacon? <Link href="/signup">Create an account</Link>
                </div>
            </div>
        </div>
    );
}
