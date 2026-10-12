'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/utils/api';
import toast from 'react-hot-toast';
import { Sparkles, Calendar, ShieldAlert, Award, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export default function FounderBrainPage() {
    const [brief, setBrief] = useState('');
    const [healthScore, setHealthScore] = useState(0);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadBrainData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/ai/brief'), {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setBrief(data.brief || 'No briefing found.');
                setHealthScore(data.healthScore || 0);
                setMetrics(data.metrics || null);
            } else {
                toast.error('Failed to load strategic briefing');
            }
        } catch (err) {
            console.error(err);
            toast.error('Network failure');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBrainData();
    }, []);

    // Helper to calculate SVG dial dashoffset
    const getDialColor = (score) => {
        if (score >= 80) return '#10b981'; // Success Green
        if (score >= 50) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Founder Brain diagnostics...</div>;

    const radius = 60;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (healthScore / 100) * circumference;

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Founder Brain</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Strategic decision support, deterministic company diagnostics, and AI co-founder reviews.</p>
                </div>
                <button 
                    onClick={() => loadBrainData(true)} 
                    disabled={refreshing} 
                    className="btn-primary" 
                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', boxShadow: 'none' }}
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                
                {/* Health Score Dial Card */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', alignSelf: 'flex-start', fontWeight: 800 }}>Startup Health 2.0</h3>
                    
                    {/* SVG Radial Gauge */}
                    <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                        <svg height="160" width="160">
                            <circle
                                stroke="var(--border)"
                                fill="transparent"
                                strokeWidth={strokeWidth}
                                r={normalizedRadius}
                                cx="80"
                                cy="80"
                            />
                            <circle
                                stroke={getDialColor(healthScore)}
                                fill="transparent"
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference + ' ' + circumference}
                                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                                r={normalizedRadius}
                                cx="80"
                                cy="80"
                            />
                        </svg>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: '1' }}>{healthScore}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.25rem' }}>Index Score</span>
                        </div>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1.5rem', lineHeight: '1.5' }}>
                        This index is calculated deterministically: 40% Runway, 25% Milestones, 20% Task Velocity, and 15% Decision Success.
                    </p>
                </div>

                {/* Score Diagnostic Breakdown Card */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontWeight: 800 }}>Diagnostic Elements</h3>
                    
                    {metrics ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Runway Metric */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Runway Health</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Months Remaining: {metrics.runwayMonths === Infinity ? 'Infinite' : metrics.runwayMonths.toFixed(1)}</div>
                                </div>
                                <strong style={{ color: getDialColor(metrics.runwayScore) }}>{metrics.runwayScore}/100</strong>
                            </div>

                            {/* Task Completion Metric */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Execution Velocity</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks Complete: {metrics.completedTasksCount}/{metrics.totalTasks}</div>
                                </div>
                                <strong style={{ color: getDialColor(metrics.taskScore) }}>{metrics.taskScore.toFixed(0)}/100</strong>
                            </div>

                            {/* Milestone Progress Metric */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Milestone Progress</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Achieved: {metrics.achievedMilestonesCount}/{metrics.totalMilestones}</div>
                                </div>
                                <strong style={{ color: getDialColor(metrics.milestoneScore) }}>{metrics.milestoneScore.toFixed(0)}/100</strong>
                            </div>

                            {/* Decision Success Metric */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.25rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Decision Success</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Evaluated Success: {metrics.successDecisionsCount}/{metrics.evaluatedDecisionsCount}</div>
                                </div>
                                <strong style={{ color: getDialColor(metrics.decisionScore) }}>{metrics.decisionScore.toFixed(0)}/100</strong>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No metrics synced.</div>
                    )}
                </div>

            </div>

            {/* Overdue Decision Warnings */}
            {metrics && metrics.pendingOverdueCount > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShieldAlert color="var(--danger)" size={24} />
                        <div>
                            <strong style={{ color: 'var(--danger)', fontSize: '0.95rem' }}>Outcome Evaluation Overdue</strong>
                            <p style={{ margin: '0.1rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>You have {metrics.pendingOverdueCount} decisions pending review. Logs need outcomes to compute Success metrics.</p>
                        </div>
                    </div>
                    <Link href="/dashboard/decisions" className="btn-primary" style={{ padding: '0.5rem 1.25rem', background: 'var(--danger)', boxShadow: 'none', textDecoration: 'none', fontSize: '0.8rem' }}>
                        Review Decisions
                    </Link>
                </div>
            )}

            {/* Morning Executive Briefing (Push Notification style card) */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border)', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <Sparkles size={22} color="var(--accent)" />
                    <h3 style={{ margin: 0, fontWeight: 800 }}>Co-Founder Diagnostic Briefing</h3>
                </div>

                <div style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                    <ReactMarkdown>{brief}</ReactMarkdown>
                </div>
            </div>

        </div>
    );
}
