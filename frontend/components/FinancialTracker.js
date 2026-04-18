'use client';

import { Activity, AlertTriangle, Briefcase } from 'lucide-react';

export default function FinancialTracker({ financials, isAdmin }) {
    const revenue = financials?.revenue || 0;
    const funding = financials?.funding || 0;
    const burn = financials?.burnRate || 0;

    const cash = financials?.cashInBank || financials?.funding || 0;

    let runway = burn > 0 ? (cash / burn).toFixed(1) : '∞';
    const isCritical = runway !== '∞' && runway < 6;
    const isWarning = runway !== '∞' && runway >= 6 && runway < 12;

    const simulatedRunway = burn > 0 ? (cash / (burn + 10000)).toFixed(1) : '∞';

    return (
        <div className={`kpi-widget ${isCritical ? 'glow-danger' : isWarning ? 'glow-warning' : ''}`} style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', padding: '1.5rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Activity size={16} /> Survival Runway (Run Rate)
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: isCritical ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--foreground)', lineHeight: 1 }}>
                        {runway} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>months left</span>
                    </div>
                </div>
                {isCritical && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.5rem 1rem', borderRadius: '24px', fontSize: '0.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={16} /> CRITICAL: Raise Seed
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monthly Burn</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--danger)' }}>-${burn.toLocaleString()}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Revenue</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--success)' }}>+${revenue.toLocaleString()}</div>
                </div>
            </div>

            {isAdmin && burn > 0 && (
                <div style={{ mt: 'auto', marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', alignItems: 'center', border: '1px solid var(--border)' }}>
                    <Briefcase size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.4 }}>
                        <strong>CFO Sim:</strong> If you hire 1 Senior Engineer (~$10k/mo avg), your runway violently drops to <strong>{simulatedRunway} months</strong>.
                    </span>
                </div>
            )}
        </div>
    );
}
