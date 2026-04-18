import { Target, Zap, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function EmptyStateOnboarding() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '16px', border: '1px dashed var(--border)', margin: '2rem 0', gridColumn: '1 / -1' }}>
            <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                <Rocket size={48} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--foreground)', marginBottom: '0.75rem' }}>Welcome to your Command Center</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '450px', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                Your workspace is completely empty. Don't let your startup drift—tell the system exactly what you need to execute next to gain momentum.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/dashboard/manage" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent)', color: 'white', padding: '0.85rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                    <Zap size={18} /> Initialize Financials
                </Link>
                <Link href="/dashboard/manage" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-app)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '0.85rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                    <Target size={18} /> Create First Task
                </Link>
            </div>
        </div>
    );
}
