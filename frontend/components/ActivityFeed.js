'use client';

import { Zap, Target, CheckCircle, Briefcase, FileText, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeed({ activities = [] }) {
    if (!activities || activities.length === 0) {
        return (
            <div className="card" style={{ height: '100%' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={18} color="var(--accent)" /> Live Activity
                </h3>
                <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No recent activity to display.
                </div>
            </div>
        );
    }

    const getIcon = (action) => {
        switch (action) {
            case 'created task': return <FileText size={16} color="var(--accent)" />;
            case 'completed task': return <CheckCircle size={16} color="var(--success)" />;
            case 'planted milestone': return <Target size={16} color="var(--warning)" />;
            case 'achieved milestone': return <Zap size={16} color="var(--danger)" />;
            case 'updated financials': return <Briefcase size={16} color="var(--accent)" />;
            default: return <User size={16} color="var(--text-muted)" />;
        }
    };

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Zap size={18} color="var(--accent)" /> Team Activity
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '400px', paddingRight: '0.5rem' }}>
                {activities.slice(0, 15).map((log, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ marginTop: '0.2rem', background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border)' }}>
                            {getIcon(log.action)}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>
                                <span style={{ fontWeight: 600 }}>{log.user?.name || log.user?.email || 'Someone'}</span> {log.action}{' '}
                                {log.detail && <span style={{ color: 'var(--text-muted)' }}>"{log.detail}"</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
