'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setSubmitted(true);
                toast.success('Recovery request submitted!');
            } else {
                toast.error(data.message || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            toast.error('Network error. Please try again later.');
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
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Recover Account</h2>
                    <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Enter your email address to receive a secure password recovery link.
                    </p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label htmlFor="email" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
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
                            {loading ? 'Sending Request...' : 'Send Recovery Link'}
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
                            ✉️
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Check Your Email</h3>
                        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                            If an account exists with <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{email}</strong>, a recovery link will arrive shortly. Please check your spam folder if it doesn't appear.
                        </p>
                        <button
                            onClick={() => setSubmitted(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--accent, #4f46e5)',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Try a different email
                        </button>
                    </div>
                )}

                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border, #334155)', paddingTop: '1.5rem', textAlign: 'center' }}>
                    <Link href="/login" style={{
                        color: 'var(--text-muted, #94a3b8)',
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--text-main, #f8fafc)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted, #94a3b8)'}
                    >
                        Back to Log In
                    </Link>
                </div>
            </div>
        </div>
    );
}
