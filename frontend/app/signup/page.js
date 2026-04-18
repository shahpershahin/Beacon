'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/utils/api';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        startupName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/onboarding');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Create Workspace</h1>
                <p>Register your startup to begin tracking progress</p>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Your Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="form-group">
                        <label>Startup Name</label>
                        <input
                            type="text"
                            required
                            value={formData.startupName}
                            onChange={(e) => setFormData({ ...formData, startupName: e.target.value })}
                            placeholder="Acme Corp"
                        />
                    </div>
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
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    <span style={{ margin: '0 1rem' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            try {
                                const loadingToast = toast.loading('Signing up with Google...');
                                const res = await fetch(getApiUrl('/api/auth/google'), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ credential: credentialResponse.credential })
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message || 'Google Auth failed');
                                localStorage.setItem('token', data.token);
                                localStorage.setItem('user', JSON.stringify(data.user));
                                toast.success('Workspace created successfully!', { id: loadingToast });
                                router.push('/onboarding');
                            } catch (err) {
                                toast.error(err.message || 'Google Registration failed');
                            }
                        }}
                        onError={() => toast.error('Google Auth Failed')}
                        theme="filled_black"
                    />
                </div>

                <div className="auth-link" style={{ marginTop: '1.5rem' }}>
                    Already have an account? <Link href="/login">Login</Link>
                </div>
            </div>
        </div>
    );
}
