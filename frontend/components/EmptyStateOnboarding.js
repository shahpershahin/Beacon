'use client';

import { useState } from 'react';
import { getApiUrl } from '@/utils/api';
import toast from 'react-hot-toast';
import { Target, Zap, Rocket, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function EmptyStateOnboarding() {
    const [seeding, setSeeding] = useState(false);

    const handleSeedData = async () => {
        setSeeding(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/startup/seed'), {
                method: 'POST',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                toast.success('Workspace seeded successfully! Welcome to your Command Center.');
                // Force full page reload to fetch the populated state
                window.location.reload();
            } else {
                toast.error('Failed to seed workspace.');
            }
        } catch (err) {
            toast.error('Connection error.');
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border)', margin: '2rem 0', gridColumn: '1 / -1' }}>
            <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                <Rocket size={48} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>Welcome to your Command Center</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '450px', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                Your workspace is completely empty. Don't let your startup drift—initialize with premium demo data to see the fully featured Founder OS command center in action.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button 
                    onClick={handleSeedData} 
                    disabled={seeding}
                    className="btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}
                >
                    {seeding ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                    {seeding ? 'Seeding workspace...' : '⚡ Seed Premium Demo Workspace'}
                </button>
                <Link href="/dashboard/manage" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
                    <Target size={18} /> Manually Setup
                </Link>
            </div>
        </div>
    );
}
