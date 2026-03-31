'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            router.push('/login');
        } else {
            setUser(JSON.parse(userData));
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ color: 'var(--accent)', margin: 0, wordBreak: 'break-word', letterSpacing: '-0.02em' }}>{user.startupName || 'Startup Tracker'}</h2>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    <Link href="/dashboard" style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 'bold' }}>Overview</Link>
                    <a href="#" onClick={handleLogout} style={{ color: 'var(--text-muted)', textDecoration: 'none', marginTop: 'auto' }}>Logout</a>
                </nav>
            </aside>
            <main className="main-content">
                <header style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0 }}>Welcome, {user.name}</h2>
                    <div style={{ background: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', wordBreak: 'break-all', maxWidth: '100%' }}>
                        {user.email}
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
}
