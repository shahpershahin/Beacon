'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided. Please check the verification link in your inbox.');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`http://localhost:5001/api/auth/verify-email/${token}`);
                const data = await res.json();
                if (res.ok) {
                    setStatus('success');
                    setMessage(data.message || 'Your email address has been verified successfully!');
                    
                    // Sync the fresh status to localStorage user object if it exists
                    const userData = localStorage.getItem('user');
                    if (userData) {
                        const parsedUser = JSON.parse(userData);
                        parsedUser.isVerified = true;
                        localStorage.setItem('user', JSON.stringify(parsedUser));
                    }
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed. The token may be invalid or expired.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('A network error occurred. Please check your internet connection.');
            }
        };

        verify();
    }, [token]);

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
                maxWidth: '450px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.3s ease'
            }}>
                {status === 'verifying' && (
                    <div>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '3px solid rgba(79, 70, 229, 0.2)',
                            borderTop: '3px solid var(--accent, #4f46e5)',
                            borderRadius: '50%',
                            margin: '0 auto 1.5rem',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Verifying your email</h2>
                        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem', margin: 0 }}>
                            Please wait while we validate your credentials...
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            fontSize: '2rem'
                        }}>
                            ✅
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#22c55e' }}>Verification Complete</h2>
                        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            {message}
                        </p>
                        <Link href="/dashboard" style={{
                            background: 'var(--accent, #4f46e5)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'inline-block',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            fontSize: '2rem'
                        }}>
                            ❌
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#ef4444' }}>Verification Failed</h2>
                        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            {message}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Link href="/dashboard" style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-main, #f8fafc)',
                                border: '1px solid var(--border, #334155)',
                                padding: '0.75rem 1.25rem',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'all 0.2s'
                            }}>
                                Dashboard
                            </Link>
                            <Link href="/login" style={{
                                background: 'var(--accent, #4f46e5)',
                                color: 'white',
                                padding: '0.75rem 1.25rem',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                                transition: 'all 0.2s'
                            }}>
                                Log In
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                Loading email verification...
            </div>
        }>
            <VerifyEmailInner />
        </Suspense>
    );
}
