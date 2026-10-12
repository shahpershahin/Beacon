'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import TaskBoard from '@/components/TaskBoard';
import MilestoneTracker from '@/components/MilestoneTracker';
import FinancialTracker from '@/components/FinancialTracker';
import ProgressOverview from '@/components/ProgressOverview';
import StartupChart from '@/components/StartupChart';
import TodayFocus from '@/components/TodayFocus';
import EmptyStateOnboarding from '@/components/EmptyStateOnboarding';
import SprintManager from '@/components/SprintManager';
import FounderCRM from '@/components/FounderCRM';
import TeamRoster from '@/components/TeamRoster';
import Roadmap from '@/components/Roadmap';
import ActivityFeed from '@/components/ActivityFeed';
import { io } from 'socket.io-client';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl, SOCKET_URL } from '@/utils/api';
import toast from 'react-hot-toast';
import { 
    LayoutDashboard, 
    Kanban, 
    Calculator, 
    Sparkles, 
    Coffee, 
    Shield, 
    Activity, 
    ArrowRight, 
    TrendingUp, 
    Plus, 
    Zap, 
    AlertTriangle, 
    Clock, 
    Sliders, 
    DollarSign,
    CheckCircle2,
    Layers,
    Terminal,
    Palette
} from 'lucide-react';

export default function Dashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeChannel = searchParams.get('channel') || 'General';

    const [startupData, setStartupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'kanban' | 'simulator'
    const [founderMode, setFounderMode] = useState(true);
    const [briefModalOpen, setBriefModalOpen] = useState(false);
    const [morningBrief, setMorningBrief] = useState(null);
    const [briefLoading, setBriefLoading] = useState(false);
    const [userRole, setUserRole] = useState('Employee');
    const [userDepartment, setUserDepartment] = useState('General');

    // Runway Scenario Simulator State
    const [simBurnDelta, setSimBurnDelta] = useState(0); // monthly burn adjustment
    const [simFundingDelta, setSimFundingDelta] = useState(0); // extra funding injected

    const fetchData = useCallback(async (silent = false) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(getApiUrl('/api/startup'), {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setStartupData(data);
                if (data.userRole) {
                    setUserRole(data.userRole);
                    localStorage.setItem('userRole', data.userRole);
                    window.dispatchEvent(new Event('roleSync'));
                }
                if (data.userDepartment) setUserDepartment(data.userDepartment);
            }
        } catch (err) {
            console.error('Fetch startup error:', err);
            if (!silent) toast.error('Could not sync startup telemetry.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(SOCKET_URL);
        
        socket.on('startup_updated', () => {
            fetchData(true);
        });

        socket.on('notification', (data) => {
            if (data?.message) {
                toast(data.message, {
                    icon: '⚡',
                    style: {
                        borderRadius: '6px',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem'
                    }
                });
            }
        });

        return () => socket.disconnect();
    }, [fetchData]);

    const handleGetMorningBrief = async () => {
        setBriefModalOpen(true);
        if (morningBrief) return;
        setBriefLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/ai/brief'), {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setMorningBrief(data.brief);
        } catch (err) {
            setMorningBrief("Failed to generate brief. Please ensure GEMINI_API_KEY is configured in your backend.");
        } finally {
            setBriefLoading(false);
        }
    };

    const isAdmin = useMemo(() => {
        return userRole?.toLowerCase() === 'admin' ||
            userRole?.toLowerCase() === 'founder' ||
            startupData?.role?.toLowerCase() === 'founder' ||
            startupData?.role?.toLowerCase() === 'admin';
    }, [userRole, startupData?.role]);

    const rawTasks = useMemo(() => startupData?.tasks || [], [startupData?.tasks]);

    const filteredTasks = useMemo(() => {
        return activeChannel === 'General'
            ? rawTasks
            : rawTasks.filter(t => t.department === activeChannel);
    }, [rawTasks, activeChannel]);

    const hasData = useMemo(() => {
        if (!startupData) return false;
        return rawTasks.length > 0 || 
            (startupData.milestones && startupData.milestones.length > 0) || 
            (startupData.financials && (startupData.financials.revenue > 0 || startupData.financials.funding > 0 || startupData.financials.burnRate > 0));
    }, [startupData, rawTasks]);

    // Financial & Health Telemetry calculations
    const { 
        cash, 
        burn, 
        runwayMonths, 
        runwayScore, 
        taskScore, 
        milestoneScore, 
        decisionScore, 
        healthScore, 
        sparklinePointsStr 
    } = useMemo(() => {
        const financials = startupData?.financials || {};
        const cashVal = financials.cashInBank || financials.funding || 0;
        const burnVal = financials.burnRate || 0;
        const runway = burnVal > 0 ? (cashVal / burnVal) : Infinity;

        let rScore = 100;
        if (runway !== Infinity) {
            if (runway >= 12) rScore = 100;
            else if (runway >= 6) rScore = 70;
            else if (runway >= 3) rScore = 40;
            else rScore = 10;
        }

        const totalT = rawTasks.length;
        const completedT = rawTasks.filter(t => t.status === 'completed').length;
        const tScore = totalT > 0 ? (completedT / totalT) * 100 : 100;

        const totalM = (startupData?.milestones || []).length;
        const achievedM = (startupData?.milestones || []).filter(m => m.achieved).length;
        const mScore = totalM > 0 ? (achievedM / totalM) * 100 : 100;

        const evaluatedDec = (startupData?.decisions || []).filter(d => d.status === 'Success' || d.status === 'Failure');
        const successDec = evaluatedDec.filter(d => d.status === 'Success').length;
        const dScore = evaluatedDec.length > 0 ? (successDec / evaluatedDec.length) * 100 : 100;

        const hScore = Math.round((rScore * 0.40) + (tScore * 0.20) + (mScore * 0.25) + (dScore * 0.15));

        let points = [];
        const events = (startupData?.memoryEvents || [])
            .filter(e => e.type === 'financial')
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        events.forEach(e => {
            const match = e.detail?.match(/Cash in Bank: \$(\d+)/);
            if (match) points.push(parseInt(match[1]));
        });

        if (points.length < 4) {
            points = [];
            for (let i = 5; i >= 0; i--) {
                points.push(cashVal + (burnVal * i));
            }
        }

        const minVal = Math.min(...points);
        const maxVal = Math.max(...points);
        const range = maxVal - minVal || 1;
        const w = 260;
        const h = 30;

        const pStr = points.map((val, idx) => {
            const x = (idx / (points.length - 1)) * w;
            const y = h - ((val - minVal) / range) * (h - 6) - 3;
            return `${x},${y}`;
        }).join(' ');

        return {
            cash: cashVal,
            burn: burnVal,
            runwayMonths: runway,
            runwayScore: rScore,
            taskScore: tScore,
            milestoneScore: mScore,
            decisionScore: dScore,
            healthScore: hScore,
            sparklinePointsStr: pStr
        };
    }, [startupData, rawTasks]);

    // Runway Simulator dynamic calculations
    const simulatedMetrics = useMemo(() => {
        const effectiveCash = Math.max(0, cash + simFundingDelta);
        const effectiveBurn = Math.max(1, burn + simBurnDelta);
        const simulatedRunway = effectiveCash / effectiveBurn;
        
        const now = new Date();
        const zeroCashDate = new Date(now.getTime() + (simulatedRunway * 30.4 * 24 * 60 * 60 * 1000));
        
        return {
            effectiveCash,
            effectiveBurn,
            simulatedRunway,
            zeroCashDateStr: simulatedRunway >= 120 ? '5+ Years' : zeroCashDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
    }, [cash, burn, simBurnDelta, simFundingDelta]);

    // Active sprint and team bottleneck computations
    const { activeSprint, sprintProgress, bottlenecks, overdueReviewsCount } = useMemo(() => {
        const sprint = (startupData?.sprints || []).find(s => s.active);
        const sprintTasks = sprint ? rawTasks.filter(t => t.sprintId === sprint._id) : [];
        const progress = sprintTasks.length > 0
            ? (sprintTasks.filter(t => t.status === 'completed').length / sprintTasks.length) * 100
            : taskScore;

        const pending = rawTasks.filter(t => t.status !== 'completed');
        const assigneeCounts = {};
        pending.forEach(t => {
            const name = t.assignee?.name || 'Unassigned';
            assigneeCounts[name] = (assigneeCounts[name] || 0) + 1;
        });

        const bottle = Object.entries(assigneeCounts)
            .map(([name, count]) => ({ assignee: name, count }))
            .filter(b => b.count >= 1 && b.assignee !== 'Unassigned')
            .sort((a, b) => b.count - a.count)
            .slice(0, 2);

        const overdue = (startupData?.decisions || []).filter(d => 
            d.status === 'Pending' && new Date(d.reviewDate) <= new Date()
        ).length;

        return {
            activeSprint: sprint,
            sprintProgress: progress,
            bottlenecks: bottle,
            overdueReviewsCount: overdue
        };
    }, [startupData, rawTasks, taskScore]);

    // Channels configuration with vector icons
    const channels = [
        { id: 'General', label: 'All-Hands', icon: Layers },
        { id: 'Engineering', label: 'Engineering', icon: Terminal },
        { id: 'Design', label: 'Design', icon: Palette },
        { id: 'Finance', label: 'Finance', icon: DollarSign }
    ];

    const handleSwitchChannel = (chId) => {
        if (chId === 'General') {
            router.push('/dashboard');
        } else {
            router.push(`/dashboard?channel=${chId}`);
        }
    };

    const handleTasksOptimisticUpdate = (updatedTasks) => {
        setStartupData(prev => prev ? { ...prev, tasks: updatedTasks } : prev);
    };

    // Skeleton loader during initial mount
    if (loading && !startupData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                <div style={{ height: '44px', background: 'var(--bg-surface)', borderRadius: '6px', opacity: 0.6 }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ height: '240px', background: 'var(--bg-surface)', borderRadius: '6px' }}></div>
                    <div style={{ height: '240px', background: 'var(--bg-surface)', borderRadius: '6px' }}></div>
                    <div style={{ height: '240px', background: 'var(--bg-surface)', borderRadius: '6px' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Top Command Bar & Switchers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    {/* Channel Pills */}
                    <div className="channel-nav">
                        {channels.map(ch => {
                            const Icon = ch.icon;
                            return (
                                <button
                                    key={ch.id}
                                    onClick={() => handleSwitchChannel(ch.id)}
                                    className={`channel-pill ${activeChannel === ch.id ? 'active' : ''}`}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                                >
                                    <Icon size={13} style={{ opacity: activeChannel === ch.id ? 1 : 0.7 }} />
                                    <span>{ch.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* View Tabs: Executive vs Kanban vs Runway Simulator */}
                    <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.2rem', gap: '2px' }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.35rem 0.8rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: activeTab === 'overview' ? 600 : 500,
                                border: activeTab === 'overview' ? '1px solid var(--border)' : '1px solid transparent',
                                background: activeTab === 'overview' ? 'var(--bg-card)' : 'transparent',
                                color: activeTab === 'overview' ? 'var(--text-main)' : 'var(--text-muted)',
                                boxShadow: activeTab === 'overview' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <LayoutDashboard size={13} />
                            <span>Executive Deck</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('kanban')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.35rem 0.8rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: activeTab === 'kanban' ? 600 : 500,
                                border: activeTab === 'kanban' ? '1px solid var(--border)' : '1px solid transparent',
                                background: activeTab === 'kanban' ? 'var(--bg-card)' : 'transparent',
                                color: activeTab === 'kanban' ? 'var(--text-main)' : 'var(--text-muted)',
                                boxShadow: activeTab === 'kanban' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <Kanban size={13} />
                            <span>Kanban Tasks</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('simulator')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.35rem 0.8rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: activeTab === 'simulator' ? 600 : 500,
                                border: activeTab === 'simulator' ? '1px solid var(--border)' : '1px solid transparent',
                                background: activeTab === 'simulator' ? 'var(--bg-card)' : 'transparent',
                                color: activeTab === 'simulator' ? 'var(--text-main)' : 'var(--text-muted)',
                                boxShadow: activeTab === 'simulator' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <Calculator size={13} />
                            <span>Runway Lab</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard Action Speed Dial */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button 
                        onClick={handleGetMorningBrief} 
                        className="btn-secondary" 
                        style={{ padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                        <Sparkles size={14} style={{ color: 'var(--text-main)' }} />
                        <span>Executive Brief</span>
                    </button>

                    <label 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.45rem', 
                            cursor: 'pointer', 
                            background: 'var(--bg-surface)', 
                            padding: '0.45rem 0.85rem', 
                            borderRadius: 'var(--radius-sm)', 
                            border: founderMode ? '1px solid var(--border)' : '1px solid var(--border)', 
                            boxShadow: founderMode ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                            transition: 'all 0.15s ease', 
                            userSelect: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 600
                        }}
                    >
                        <input type="checkbox" checked={founderMode} onChange={(e) => setFounderMode(e.target.checked)} style={{ display: 'none' }} />
                        <Shield size={13} style={{ color: founderMode ? 'var(--text-main)' : 'var(--text-muted)' }} />
                        <span style={{ color: founderMode ? 'var(--text-main)' : 'var(--text-muted)' }}>Director View</span>
                    </label>
                </div>
            </div>

            {/* Notion Callout block for workspace telemetry */}
            <div className="notion-callout" style={{ margin: '0 0 0.25rem 0' }}>
                <div className="notion-callout-icon">💡</div>
                <div className="notion-callout-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                        <strong style={{ fontWeight: 600, color: 'var(--text-main)' }}>Workspace Telemetry:</strong>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>
                            {runwayMonths >= 12 
                                ? `Solvent horizon at ${runwayMonths.toFixed(1)} months. Healthy velocity across ${rawTasks.length} active tasks.`
                                : runwayMonths >= 6 
                                ? `Cautious runway horizon (${runwayMonths.toFixed(1)} mo). Balance monthly burn with delivery goals.`
                                : `Critical capital horizon alert (<3 months remaining). Prioritize capital preservation.`}
                        </span>
                    </div>
                    <button 
                        onClick={handleGetMorningBrief}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', border: '1px solid var(--border)' }}
                    >
                        ✦ Briefing
                    </button>
                </div>
            </div>

            {!hasData ? (
                <EmptyStateOnboarding />
            ) : activeTab === 'kanban' ? (
                /* Dedicated High-Performance Kanban Task View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                                {activeChannel} Task Board
                            </h2>
                            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                Instant drag & drop velocity • Real-time threaded collaboration
                            </p>
                        </div>
                    </div>
                    <TaskBoard
                        tasks={filteredTasks}
                        onUpdate={handleTasksOptimisticUpdate}
                        activeChannel={activeChannel}
                        userDepartment={userDepartment}
                        isAdmin={isAdmin}
                    />
                </div>
            ) : activeTab === 'simulator' ? (
                /* Interactive Runway Scenario Lab */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Sliders size={20} style={{ color: 'var(--accent)' }} />
                                    <span>Runway & Burn Scenario Lab</span>
                                </h2>
                                <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Simulate startup runway trajectory under hiring, cost-cutting, or fundraising scenarios.
                                </p>
                            </div>
                            <button
                                onClick={() => { setSimBurnDelta(0); setSimFundingDelta(0); }}
                                className="btn-secondary"
                                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                            >
                                Reset Scenario
                            </button>
                        </div>

                        {/* Interactive Sliders & Comparison Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                            {/* Inputs Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                            Monthly Burn Adjustment
                                        </label>
                                        <span className="mono-data" style={{ fontSize: '0.9rem', fontWeight: 800, color: simBurnDelta > 0 ? '#ef4444' : simBurnDelta < 0 ? '#10b981' : 'var(--text-muted)' }}>
                                            {simBurnDelta >= 0 ? `+$${simBurnDelta.toLocaleString()}` : `-$${Math.abs(simBurnDelta).toLocaleString()}`}/mo
                                        </span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="-30000" 
                                        max="60000" 
                                        step="2500" 
                                        value={simBurnDelta}
                                        onChange={(e) => setSimBurnDelta(parseInt(e.target.value))}
                                        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        <span>-$30k (Cost Reduction)</span>
                                        <span>Current (${burn.toLocaleString()})</span>
                                        <span>+$60k (Aggressive Scaling)</span>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                            Capital Inflow / Injection
                                        </label>
                                        <span className="mono-data" style={{ fontSize: '0.9rem', fontWeight: 800, color: simFundingDelta > 0 ? '#10b981' : 'var(--text-muted)' }}>
                                            +${simFundingDelta.toLocaleString()}
                                        </span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1000000" 
                                        step="25000" 
                                        value={simFundingDelta}
                                        onChange={(e) => setSimFundingDelta(parseInt(e.target.value))}
                                        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        <span>$0</span>
                                        <span>+$250k (Angel / Pre-seed)</span>
                                        <span>+$1M (Seed Inflow)</span>
                                    </div>
                                </div>

                                {/* Preset Buttons */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button 
                                        onClick={() => { setSimBurnDelta(-5000); setSimFundingDelta(0); }}
                                        className="btn-secondary" 
                                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                                    >
                                        Trim 10% Burn (-$5k)
                                    </button>
                                    <button 
                                        onClick={() => { setSimBurnDelta(15000); setSimFundingDelta(0); }}
                                        className="btn-secondary" 
                                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                                    >
                                        +2 Engineers (+$15k/mo)
                                    </button>
                                    <button 
                                        onClick={() => { setSimBurnDelta(0); setSimFundingDelta(250000); }}
                                        className="btn-secondary" 
                                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                                    >
                                        +$250k Angel Inflow
                                    </button>
                                </div>
                            </div>

                            {/* Simulated Results Display */}
                            <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                                        Simulated Liquid Horizon
                                    </span>
                                    <span style={{ 
                                        fontSize: '0.72rem', 
                                        fontWeight: 700, 
                                        padding: '0.2rem 0.6rem', 
                                        borderRadius: 'var(--radius-sm)',
                                        background: simulatedMetrics.simulatedRunway >= 12 ? 'rgba(16, 185, 129, 0.12)' : simulatedMetrics.simulatedRunway >= 6 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                        color: simulatedMetrics.simulatedRunway >= 12 ? '#10b981' : simulatedMetrics.simulatedRunway >= 6 ? '#f59e0b' : '#ef4444',
                                        border: `1px solid ${simulatedMetrics.simulatedRunway >= 12 ? 'rgba(16, 185, 129, 0.25)' : simulatedMetrics.simulatedRunway >= 6 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                                    }}>
                                        {simulatedMetrics.simulatedRunway >= 12 ? '● Solvent Runway (>12mo)' : simulatedMetrics.simulatedRunway >= 6 ? '▲ Caution Zone' : '■ Critical Horizon'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                                    <div className="mono-data" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                                        {simulatedMetrics.simulatedRunway >= 120 ? '10+ Yrs' : `${simulatedMetrics.simulatedRunway.toFixed(1)}`}
                                    </div>
                                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Months</span>
                                    <span style={{ fontSize: '0.8rem', color: simulatedMetrics.simulatedRunway >= runwayMonths ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                        ({simulatedMetrics.simulatedRunway >= runwayMonths ? '+' : ''}{(simulatedMetrics.simulatedRunway - runwayMonths).toFixed(1)} mo vs current)
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', fontSize: '0.82rem' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Total Capital Pool</span>
                                        <strong className="mono-data" style={{ fontSize: '0.95rem' }}>${simulatedMetrics.effectiveCash.toLocaleString()}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Zero-Cash Projection</span>
                                        <strong className="mono-data" style={{ fontSize: '0.95rem' }}>{simulatedMetrics.zeroCashDateStr}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Primary Executive Command Deck View */
                <>
                    {/* Action Speed Dial Bar */}
                    <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            onClick={() => setActiveTab('kanban')}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 600 }}
                        >
                            <Plus size={14} style={{ color: 'var(--accent)' }} />
                            <span>Quick Task</span>
                        </button>

                        <Link
                            href="/dashboard/decisions"
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
                        >
                            <Shield size={14} style={{ color: '#f59e0b' }} />
                            <span>Log Decision</span>
                        </Link>

                        <Link
                            href="/dashboard/timeline"
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
                        >
                            <Activity size={14} style={{ color: '#10b981' }} />
                            <span>Milestone Stream</span>
                        </Link>

                        <button
                            onClick={() => setActiveTab('simulator')}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 600 }}
                        >
                            <Calculator size={14} style={{ color: 'var(--accent)' }} />
                            <span>Runway Simulator</span>
                        </button>
                    </div>

                    {founderMode && activeChannel === 'General' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
                            
                            {/* COLUMN 1: Financial & Health */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Health Score Dial */}
                                <Link href="/dashboard/founder-brain" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card metric-glow-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Startup Health Score</h4>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>Diagnostics →</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                                                <svg height="80" width="80">
                                                    <circle stroke="var(--border)" fill="transparent" strokeWidth="6" r="32" cx="40" cy="40" />
                                                    <circle stroke={healthScore >= 80 ? '#10b981' : healthScore >= 50 ? '#f59e0b' : '#ef4444'} fill="transparent" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={`${2 * Math.PI * 32 * (1 - healthScore / 100)}`} style={{ transition: 'stroke-dashoffset 0.5s', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} r="32" cx="40" cy="40" />
                                                </svg>
                                                <div className="mono-data" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', fontWeight: 900 }}>
                                                    {healthScore}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                                Runway index: <strong className="mono-data">{runwayScore}/100</strong><br/>
                                                Execution velocity: <strong className="mono-data">{taskScore.toFixed(0)}/100</strong><br/>
                                                Milestones: <strong className="mono-data">{milestoneScore.toFixed(0)}/100</strong>
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Runway Cash/Burn Card */}
                                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Runway & Capital</h4>
                                        <button 
                                            onClick={() => setActiveTab('simulator')} 
                                            style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Simulate →
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <div className="mono-data" style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                                            {runwayMonths === Infinity ? 'Infinite' : `${runwayMonths.toFixed(1)} Months`}
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated liquid runway</span>
                                    </div>
                                    
                                    {/* Sparkline Micro-graph */}
                                    <div style={{ height: '30px', display: 'flex', alignItems: 'center', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                                        <svg width="100%" height="30" style={{ overflow: 'visible' }}>
                                            <polyline
                                                fill="none"
                                                stroke="var(--accent)"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                points={sparklinePointsStr}
                                                style={{ opacity: 0.85 }}
                                            />
                                        </svg>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', fontSize: '0.85rem' }}>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Cash in Bank</span>
                                            <strong className="mono-data" style={{ color: 'var(--text-main)', fontSize: '1rem' }}>${cash.toLocaleString()}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Monthly Burn</span>
                                            <strong className="mono-data" style={{ color: 'var(--text-main)', fontSize: '1rem' }}>${burn.toLocaleString()}/mo</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMN 2: Strategy & Memory */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Decisions Ledger Card */}
                                <Link href="/dashboard/decisions" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Recent Decisions</h4>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>Ledger →</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {(startupData?.decisions || []).slice(0, 3).length === 0 ? (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No decisions logged yet.</div>
                                            ) : (
                                                (startupData?.decisions || []).slice(0, 3).map(d => (
                                                    <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px', fontWeight: 600 }}>{d.title}</div>
                                                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: d.status === 'Success' ? 'rgba(16, 185, 129, 0.1)' : d.status === 'Failure' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: d.status === 'Success' ? 'var(--success)' : d.status === 'Failure' ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                                                            {d.status}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </Link>

                                {/* Company Timeline Card */}
                                <Link href="/dashboard/timeline" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Memory Stream</h4>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>Events →</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {(startupData?.memoryEvents || []).slice(0, 3).length === 0 ? (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No memory events indexed.</div>
                                            ) : (
                                                (startupData?.memoryEvents || []).slice(0, 3).map(e => (
                                                    <div key={e._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(e.timestamp).toLocaleDateString()}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>

                            {/* COLUMN 3: Operations & Team Pulse */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Operations Alerts */}
                                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Operations alerts</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                                        {overdueReviewsCount > 0 ? (
                                            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                <AlertTriangle size={14} />
                                                <span>{overdueReviewsCount} strategic decision reviews overdue</span>
                                            </div>
                                        ) : (
                                            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                <CheckCircle2 size={14} />
                                                <span>All decisions evaluated and closed</span>
                                            </div>
                                        )}
                                        {runwayMonths < 6 ? (
                                            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                <AlertTriangle size={14} />
                                                <span>Low runway horizon: {runwayMonths.toFixed(1)} months remaining</span>
                                            </div>
                                        ) : (
                                            <div style={{ background: 'var(--bg-app)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />
                                                <span>Capital runway index optimal</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Team Pulse & Sprint Execution */}
                                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Team Pulse</h4>
                                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent-subtle)', color: 'var(--accent)', fontWeight: 700 }}>
                                            {activeSprint ? activeSprint.theme : 'Sprint Active'}
                                        </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                                             <span>Sprint Completion</span>
                                             <span>{sprintProgress.toFixed(0)}%</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                                             <div style={{ width: `${sprintProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.4s ease' }}></div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Workload & Bottlenecks</span>
                                        {bottlenecks.length === 0 ? (
                                             <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Zero critical path bottlenecks detected.</div>
                                        ) : (
                                             bottlenecks.map((b, idx) => (
                                                 <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                                     <span style={{ color: b.count > 3 ? 'var(--danger)' : 'var(--accent)' }}>●</span>
                                                     <div style={{ flex: 1, color: 'var(--text-main)' }}>
                                                         <strong>{b.assignee}</strong> has <strong>{b.count}</strong> pending items
                                                     </div>
                                                 </div>
                                             ))
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <>
                            {/* Finance Specific Layout Pivot */}
                            {activeChannel === 'Finance' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', width: '100%' }}>
                                    <FinancialTracker
                                        financials={startupData?.financials || {}}
                                        onUpdate={() => fetchData(true)}
                                        isAdmin={isAdmin}
                                    />
                                    <StartupChart financials={startupData?.financials || {}} />
                                </div>
                            )}

                            {/* Engineering Specific Layout Pivot */}
                            {activeChannel === 'Engineering' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', width: '100%' }}>
                                    <SprintManager
                                        sprints={startupData?.sprints || []}
                                        tasks={filteredTasks}
                                        onUpdate={() => fetchData(true)}
                                        isAdmin={isAdmin}
                                    />
                                    <ProgressOverview tasks={filteredTasks} milestones={startupData?.milestones || []} />
                                </div>
                            )}

                            {/* Standard Blended View for other channels */}
                            {(activeChannel === 'General' || activeChannel === 'Design' || activeChannel === 'Operations') && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                                    <div style={{ flex: '2 1 500px', minWidth: 0 }}>
                                        <StartupChart financials={startupData?.financials || {}} />
                                    </div>
                                    {!founderMode && (
                                        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                                            <TodayFocus tasks={filteredTasks} />
                                        </div>
                                    )}
                                    {founderMode && (
                                        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                                            <SprintManager
                                                sprints={startupData?.sprints || []}
                                                tasks={filteredTasks}
                                                onUpdate={() => fetchData(true)}
                                                isAdmin={isAdmin}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Telemetry Row */}
                            {(activeChannel === 'General' || activeChannel === 'Finance') && (
                                <div className="telemetry-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', width: '100%', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                                    <ActivityFeed activities={startupData?.activities || []} />
                                    <ProgressOverview tasks={rawTasks} milestones={startupData?.milestones || []} />
                                    {activeChannel !== 'Finance' && (
                                        <FinancialTracker
                                            financials={startupData?.financials || {}}
                                            onUpdate={() => fetchData(true)}
                                            isAdmin={isAdmin}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Talent Hub link */}
                            {(userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'hr' || userRole?.toLowerCase() === 'founder') && activeChannel === 'General' && (
                                <div className="card" style={{ background: 'var(--bg-app)', border: '1px solid var(--accent)', padding: '1.5rem', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                            Talent & Organizational Control
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>Manage team roster, invites, and departmental ownership.</p>
                                    </div>
                                    <Link href="/dashboard/hr" className="btn-primary" style={{ padding: '0.65rem 1.25rem', textDecoration: 'none' }}>
                                        Open Team Hub →
                                    </Link>
                                </div>
                            )}

                            {/* Roadmaps & CRM */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', width: '100%' }}>
                                {activeChannel === 'General' && (
                                    <Roadmap
                                        goals={startupData?.goals || []}
                                        milestones={startupData?.milestones || []}
                                        tasks={rawTasks}
                                        isAdmin={isAdmin}
                                        onUpdate={() => fetchData(true)}
                                    />
                                )}
                                {activeChannel === 'General' && (
                                    <FounderCRM
                                        contacts={startupData?.contacts || []}
                                        onUpdate={() => fetchData(true)}
                                        isAdmin={isAdmin}
                                    />
                                )}
                            </div>

                            {/* Milestones Row */}
                            <div style={{ width: '100%', marginTop: '1.5rem' }}>
                                <MilestoneTracker
                                    milestones={startupData?.milestones || []}
                                    onUpdate={() => fetchData(true)}
                                    isAdmin={isAdmin}
                                />
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Executive Brief Modal */}
            {briefModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(8px)' }}>
                    <div className="glass-card" style={{ maxWidth: '600px', width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', maxHeight: '82vh' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: 800 }}>
                                <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                                <span>Daily Executive Briefing</span>
                            </h3>
                            <button onClick={() => setBriefModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                            {briefLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent)', justifyContent: 'center', padding: '3rem 0' }}>
                                    <Activity size={18} style={{ animation: 'pulse 1.5s infinite' }} />
                                    <span>Synthesizing runway telemetry, milestone velocity, and blockers...</span>
                                </div>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: morningBrief ? morningBrief.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') : '' }} />
                            )}
                        </div>

                        <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-app)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
                            <button className="btn-secondary" onClick={() => setBriefModalOpen(false)} style={{ padding: '0.45rem 1.25rem' }}>
                                Close Briefing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
