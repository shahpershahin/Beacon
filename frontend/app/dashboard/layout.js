'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import AICoFounder from '../../components/AICoFounder';
import QuickActions from '../../components/QuickActions';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const loadUser = () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            if (!token || !userData) {
                router.push('/login');
            } else {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);

                let savedRole = localStorage.getItem('userRole');
                if (savedRole === 'undefined' || savedRole === 'null') savedRole = null;

                // Pass the workspace role directly to state, don't let a generic profile role overwrite it
                setUserRole({
                    profile: parsedUser.role,
                    workspace: savedRole
                });
            }
        };

        loadUser();

        // Polling as a fallback if role hasn't synced yet
        const interval = setInterval(loadUser, 1000);

        window.addEventListener('storage', loadUser);
        window.addEventListener('roleSync', loadUser);
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', loadUser);
            window.removeEventListener('roleSync', loadUser);
        };
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '3rem' }}>
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>B</div>
                        <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>BEACON</h2>
                    </Link>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <div style={{ padding: '0 0.5rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Navigation</div>
                    <Link href="/dashboard" className="sidebar-link active">🏠 Overview</Link>
                    <Link href="/dashboard/wiki" className="sidebar-link">📚 Wiki</Link>
                    
                    <div style={{ marginTop: '2rem', padding: '0 0.5rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Channels</div>
                    <Link href="/dashboard?channel=General" className="sidebar-link">🏢 All-Hands</Link>
                    <Link href="/dashboard?channel=Engineering" className="sidebar-link">💻 Engineering</Link>
                    <Link href="/dashboard?channel=Design" className="sidebar-link">🎨 Design</Link>
                    <Link href="/dashboard?channel=Finance" className="sidebar-link">💰 Finance</Link>

                    <div style={{ marginTop: '2rem', padding: '0 0.5rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Startup OS</div>
                    <Link href="/dashboard/automations" className="sidebar-link">⚡ Automations</Link>
                    <Link href="/dashboard/hr" className="sidebar-link">👥 Team Hub</Link>
                    <Link href="/dashboard/manage" className="sidebar-link">⚙️ Manage</Link>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-funky))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            {user.name?.charAt(0)}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.role || 'Founder'}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Logout</button>
                </div>
            </aside>

            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Welcome back, {user.name.split(' ')[0]} ✌️</h1>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Here is what's happening with your startup today.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        )}
                        <Link href="/dashboard/profile" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}>Profile Settings</Link>
                    </div>
                </header>
                {children}
            </main>
            <AICoFounder />
            <QuickActions />
        </div>
    );
}
