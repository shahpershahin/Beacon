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
                
                // Clean up potentially corrupt localStorage strings
                let savedRole = localStorage.getItem('userRole');
                if (savedRole === 'undefined' || savedRole === 'null') savedRole = null;
                
                // Prioritize user profile role first, then fallback to valid saved role
                const role = parsedUser.role || savedRole || 'viewer';
                setUserRole(role);
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
            <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: 'var(--accent)', margin: 0, wordBreak: 'break-word', letterSpacing: '-0.02em' }}>{user.startupName || 'Startup Tracker'}</h2>
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                            title="Toggle Light/Dark Mode"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    )}
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, marginTop: '1rem' }}>
                    <Link href="/dashboard" style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 'bold' }}>Overview</Link>

                    <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Channels</div>
                    <Link href="/dashboard?channel=General" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🏢 All-Hands</Link>
                    <Link href="/dashboard?channel=Engineering" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💻 Engineering</Link>
                    <Link href="/dashboard?channel=Design" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🎨 Design</Link>
                    <Link href="/dashboard?channel=Finance" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💰 Finance</Link>
                    <Link href="/dashboard?channel=Operations" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚙️ Operations</Link>



                    <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Management</div>
                    <Link href="/dashboard/wiki" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📚 Knowledge Base</Link>

                    {/* Strict role-based access for Team & HR */}
                    {['founder', 'admin', 'hr'].includes(user.role?.toLowerCase()) || ['founder', 'admin', 'hr'].includes(userRole?.toLowerCase()) ? (
                        <Link href="/dashboard/hr" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>👥 Team & HR</Link>
                    ) : null}
                    <Link href="/dashboard/manage" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Manage Data</Link>
                    <Link href="/dashboard/integrations" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Integrations</Link>
                    <Link href="/dashboard/settings" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Settings</Link>
                    <Link href="/dashboard/profile" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Account Profile</Link>
                    <a href="#" onClick={handleLogout} style={{ color: 'var(--danger)', textDecoration: 'none', marginTop: 'auto' }}>Logout</a>
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
            <AICoFounder />
            <QuickActions />
        </div>
    );
}
