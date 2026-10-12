'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

function ResetPasswordInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            toast.error('No reset token found. Please check your recovery link.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5001/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                toast.success('Password updated successfully!');
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                toast.error(data.message || 'Reset failed. The link may have expired.');
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-main, #0f172a)',
            color: 'var(--text-main, #f8fafc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{
                background: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '16px',
                padding: '2.5rem 2rem',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        background: 'var(--accent)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '1.35rem',
                        margin: '0 auto 1rem',
                        color: 'white'
                    }}>B</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Reset Password</h2>
                    <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Establish a strong, unique password to secure your account.
                    </p>
                </div>

                {!success ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label htmlFor="password" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>New Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--border, #334155)',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem',
                                    color: 'var(--text-main, #f8fafc)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent, #4f46e5)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border, #334155)'}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--border, #334155)',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem',
                                    color: 'var(--text-main, #f8fafc)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent, #4f46e5)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border, #334155)'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: 'var(--accent, #4f46e5)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            {loading ? 'Updating Password...' : 'Reset Password'}
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                            fontSize: '1.75rem'
                        }}>
                            ✅
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#22c55e' }}>Success!</h3>
                        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                            Your password has been successfully reset. Redirecting you to the login screen in a few seconds...
                        </p>
                        <Link href="/login" style={{
                            color: 'var(--accent, #4f46e5)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'underline'
                        }}>
                            Go to Log In now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                Loading reset page...
            </div>
        }>
            <ResetPasswordInner />
        </Suspense>
    );
}
