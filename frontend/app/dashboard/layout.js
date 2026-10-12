'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { 
    LayoutDashboard, 
    BookOpen, 
    Brain, 
    ShieldAlert, 
    Milestone, 
    Search, 
    TrendingUp, 
    Layers, 
    Terminal, 
    Sparkles, 
    DollarSign, 
    Zap, 
    Users, 
    Settings, 
    LogOut, 
    Sun, 
    Moon, 
    Activity, 
    ChevronRight,
    CircleDot,
    Cpu,
    AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import AICoFounder from '../../components/AICoFounder';
import QuickActions from '../../components/QuickActions';
import CommandMenu from '../../components/CommandMenu';
import { getApiUrl } from '@/utils/api';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [sendingVerification, setSendingVerification] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
        
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(getApiUrl('/api/auth/profile'), {
                    headers: { 'x-auth-token': token }
                });
                if (res.ok) {
                    const freshUser = await res.json();
                    localStorage.setItem('user', JSON.stringify(freshUser));
                    setUser(freshUser);
                }
            } catch (err) {
                console.error('Error syncing profile on mount:', err);
            }
        };

        fetchProfile();
    }, []);

    useEffect(() => {
        const loadUser = () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            if (!token || !userData) {
                router.push('/login');
            } else {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);

                    let savedRole = localStorage.getItem('userRole');
                    if (savedRole === 'undefined' || savedRole === 'null') savedRole = null;

                    setUserRole({
                        profile: parsedUser.role,
                        workspace: savedRole
                    });
                } catch (e) {
                    console.error('Failed to parse user session:', e);
                }
            }
        };

        loadUser();

        window.addEventListener('storage', loadUser);
        window.addEventListener('roleSync', loadUser);
        window.addEventListener('userSync', loadUser);
        return () => {
            window.removeEventListener('storage', loadUser);
            window.removeEventListener('roleSync', loadUser);
            window.removeEventListener('userSync', loadUser);
        };
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        router.push('/login');
    };

    const handleResendVerification = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        setSendingVerification(true);
        try {
            const res = await fetch(getApiUrl('/api/auth/resend-verification'), {
                method: 'POST',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            
            if (res.ok) {
                toast.success(data.message || 'Verification email resent successfully!');
            } else {
                toast.error(data.message || 'Failed to resend verification.');
            }
        } catch (err) {
            toast.error('Network error. Failed to resend verification.');
        } finally {
            setSendingVerification(false);
        }
    };

    const triggerCommandMenu = () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    };

    if (!user) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', background: 'var(--bg-app)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.4rem', animation: 'pulse 1.5s infinite', boxShadow: '0 4px 16px rgba(2, 132, 199, 0.25)' }}>B</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '-0.01em' }}>Syncing Beacon Workspace...</div>
        </div>
    );

    const navLinks = [
        { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Company Wiki', path: '/dashboard/wiki', icon: BookOpen },
    ];

    const intelligenceLinks = [
        { label: 'Founder Brain', path: '/dashboard/founder-brain', icon: Brain },
        { label: 'Decisions Log', path: '/dashboard/decisions', icon: ShieldAlert },
        { label: 'Timeline', path: '/dashboard/timeline', icon: Milestone },
        { label: 'Ask Memory', path: '/dashboard/memory', icon: Search },
        { label: 'Investor Deck', path: '/dashboard/investor', icon: TrendingUp },
    ];

    const channelLinks = [
        { label: 'All-Hands', query: 'General', icon: Layers },
        { label: 'Engineering', query: 'Engineering', icon: Terminal },
        { label: 'Design', query: 'Design', icon: Sparkles },
        { label: 'Finance', query: 'Finance', icon: DollarSign },
    ];

    const osLinks = [
        { label: 'Automations', path: '/dashboard/automations', icon: Zap },
        { label: 'Team Hub', path: '/dashboard/hr', icon: Users },
        { label: 'Settings', path: '/dashboard/manage', icon: Settings },
    ];

    return (
        <div className="dashboard-layout">
            {/* Notion Iconic Sidebar */}
            <aside className="sidebar">
                {/* Notion Workspace Switcher Header */}
                <div style={{ marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                    <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.4rem', borderRadius: 'var(--radius-sm)', transition: 'background 0.12s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                            <div style={{ width: '24px', height: '24px', background: 'var(--text-main)', color: 'var(--bg-app)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem', flexShrink: 0 }}>
                                B
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 600, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user.startupName ? user.startupName : 'Beacon Workspace'}
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', transform: 'rotate(90deg)' }} />
                    </Link>

                    {/* Quick Notion Search Bar */}
                    <div style={{ marginTop: '0.6rem' }}>
                        <button
                            onClick={triggerCommandMenu}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.35rem 0.6rem',
                                color: 'var(--text-muted)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'background 0.12s'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <Search size={13} />
                                <span>Search workspace</span>
                            </div>
                            <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>⌘K</span>
                        </button>
                    </div>
                </div>

                {/* Sidebar Navigation Links */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1, overflowY: 'auto' }}>
                    <div style={{ padding: '0.5rem 0.5rem 0.25rem', fontSize: '0.68rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Workspace</div>
                    {navLinks.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link key={item.path} href={item.path} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                                <Icon size={15} style={{ opacity: isActive ? 1 : 0.7 }} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                    
                    <div style={{ marginTop: '1rem', padding: '0.5rem 0.5rem 0.25rem', fontSize: '0.68rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Intelligence</div>
                    {intelligenceLinks.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link key={item.path} href={item.path} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                                <Icon size={15} style={{ opacity: isActive ? 1 : 0.7 }} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                    
                    <div style={{ marginTop: '1rem', padding: '0.5rem 0.5rem 0.25rem', fontSize: '0.68rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Channels</div>
                    {channelLinks.map((item) => {
                        return (
                            <Link key={item.query} href={`/dashboard?channel=${item.query}`} className="sidebar-link">
                                <span style={{ opacity: 0.6, fontSize: '0.9rem', width: '15px', textAlign: 'center' }}>#</span>
                                <span>{item.label.toLowerCase()}</span>
                            </Link>
                        );
                    })}

                    <div style={{ marginTop: '1rem', padding: '0.5rem 0.5rem 0.25rem', fontSize: '0.68rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Settings</div>
                    {osLinks.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link key={item.path} href={item.path} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                                <Icon size={15} style={{ opacity: isActive ? 1 : 0.7 }} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom User Profile Section */}
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem' }}>
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                                <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', border: '2px solid var(--bg-surface)' }}></span>
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{user.name}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role || 'Founder'}</div>
                            </div>
                        </div>

                        <button 
                            onClick={handleLogout} 
                            title="Sign out"
                            style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                        >
                            <LogOut size={13} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Workspace Area */}
            <main className="main-content">
                {/* Clean Enterprise Email Verification Banner */}
                {user && !user.isVerified && (
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1.25rem',
                        marginBottom: '1.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        position: 'sticky',
                        top: '0',
                        zIndex: 100
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertTriangle size={16} color="#f59e0b" />
                            <div>
                                <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem', display: 'block' }}>Unverified Account</strong>
                                <p style={{ margin: '0.15rem 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                    Please verify your email address. Verification link sent to <strong style={{ color: 'var(--accent)' }}>{user.email}</strong>.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleResendVerification} 
                            disabled={sendingVerification}
                            className="btn-secondary"
                            style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.78rem',
                                cursor: sendingVerification ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {sendingVerification ? 'Sending...' : 'Resend Email'}
                        </button>
                    </div>
                )}

                {/* Top Executive Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Welcome back, {user.name.split(' ')[0]}</h1>
                            <span className="live-status-badge">
                                <span className="live-pulse-dot"></span>
                                Live Sync
                            </span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Startup Operating System • Real-Time Stream</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Live Team Presence Indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '0.3rem 0.65rem', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span>Connected</span>
                        </div>

                        {/* Quick Command Menu Trigger */}
                        <button
                            onClick={triggerCommandMenu}
                            className="btn-search-trigger"
                            title="Open Command Menu (⌘K)"
                        >
                            <Search size={13} />
                            <span>Command Menu</span>
                            <kbd>⌘K</kbd>
                        </button>

                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                            </button>
                        )}
                        <Link href="/dashboard/profile" className="btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', textDecoration: 'none' }}>
                            Settings
                        </Link>
                    </div>
                </header>

                {children}
            </main>

            <AICoFounder />
            <CommandMenu />
        </div>
    );
}
