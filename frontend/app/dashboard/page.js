'use client';

import { useEffect, useState } from 'react';
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
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl, SOCKET_URL } from '@/utils/api';

export default function Dashboard() {
    const [startupData, setStartupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [founderMode, setFounderMode] = useState(false);
    const [briefModalOpen, setBriefModalOpen] = useState(false);
    const [morningBrief, setMorningBrief] = useState(null);
    const [briefLoading, setBriefLoading] = useState(false);
    const [userRole, setUserRole] = useState('Employee');
    const [userDepartment, setUserDepartment] = useState('General');
    const searchParams = useSearchParams();
    const activeChannel = searchParams.get('channel') || 'General';

    useEffect(() => {
        fetchData();
        const socket = io(SOCKET_URL);
        socket.on('startup_updated', () => {
            fetchData(); // Actively re-sync state entirely when peers mutate it
        });
        return () => socket.disconnect();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(getApiUrl('/api/startup'), {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setStartupData(data);
            if (data.userRole) {
                setUserRole(data.userRole);
                localStorage.setItem('userRole', data.userRole);
                window.dispatchEvent(new Event('roleSync'));
            }
            if (data.userDepartment) setUserDepartment(data.userDepartment);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGetMorningBrief = async () => {
        setBriefModalOpen(true);
        if (morningBrief) return; // Don't refetch if already loaded
        setBriefLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/ai/brief'), {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setMorningBrief(data.brief);
        } catch (err) {
            setMorningBrief("Failed to generate brief. Please ensure GEMINI_API_KEY is set in your backend.");
        } finally {
            setBriefLoading(false);
        }
    };

    const isAdmin = userRole?.toLowerCase() === 'admin' ||
        userRole?.toLowerCase() === 'founder' ||
        startupData?.role?.toLowerCase() === 'founder' ||
        startupData?.role?.toLowerCase() === 'admin';
    const rawTasks = startupData?.tasks || [];

    // Filter tasks by department if not in 'General' or 'All-Hands'
    const filteredTasks = activeChannel === 'General'
        ? rawTasks
        : rawTasks.filter(t => t.department === activeChannel);

    const hasData = rawTasks.length > 0 || startupData?.milestones?.length > 0 || (startupData?.financials && (startupData?.financials?.revenue > 0 || startupData?.financials?.funding > 0 || startupData?.financials?.burnRate > 0));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>
                        {activeChannel === 'Engineering' ? '💻' : activeChannel === 'Design' ? '🎨' : activeChannel === 'Finance' ? '💰' : activeChannel === 'Operations' ? '⚙️' : '🏢'}
                    </span>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{activeChannel} Channel</h1>
                </div>

                {/* Dashboard Actions */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={handleGetMorningBrief} className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                        <span style={{ fontSize: '1.2rem' }}>☕</span> Morning Brief
                    </button>

                    {/* Founder Mode Toggle */}
                    <label className={`founder-toggle ${founderMode ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: '24px', border: founderMode ? '2px solid var(--accent)' : '1px solid var(--border)', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', userSelect: 'none' }}>
                        <input type="checkbox" checked={founderMode} onChange={(e) => setFounderMode(e.target.checked)} style={{ display: 'none' }} />
                        <span style={{ fontSize: '1.2rem' }}>👑</span>
                        <span style={{ fontWeight: 'bold', color: founderMode ? 'var(--accent)' : 'var(--text-muted)' }}>Founder Mode</span>
                    </label>
                </div>
            </div>

            {!hasData ? (
                <EmptyStateOnboarding />
            ) : (
                <>
                    {/* Finance Specific Layout Pivot */}
                    {activeChannel === 'Finance' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', width: '100%' }}>
                            <FinancialTracker
                                financials={startupData?.financials || {}}
                                onUpdate={fetchData}
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
                                onUpdate={fetchData}
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
                                        onUpdate={fetchData}
                                        isAdmin={isAdmin}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Telemetry Row (Shown in General/Finance) - Re-positioned for visibility */}


                    {/* Primary Execution Board (Always shown but filtered) */}
                    {!founderMode && activeChannel !== 'Finance' && (
                        <div style={{ width: '100%' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📌 {activeChannel} Task Board</h3>
                            <TaskBoard
                                tasks={filteredTasks}
                                onUpdate={fetchData}
                                activeChannel={activeChannel}
                                userDepartment={userDepartment}
                                isAdmin={isAdmin}
                            />
                        </div>
                    )}

                    {(activeChannel === 'General' || activeChannel === 'Finance') && (
                        <div className="telemetry-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', width: '100%', marginBottom: '1.5rem' }}>
                            <ActivityFeed activities={startupData?.activities || []} />

                            <ProgressOverview tasks={rawTasks} milestones={startupData?.milestones || []} />

                            {activeChannel !== 'Finance' && (
                                <FinancialTracker
                                    financials={startupData?.financials || {}}
                                    onUpdate={fetchData}
                                    isAdmin={isAdmin}
                                />
                            )}
                        </div>
                    )}
                    {/* Administrative Talent Hub (Exclusive to Founder/HR) */}
                    {(userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'hr' || userRole?.toLowerCase() === 'founder') && activeChannel === 'General' && (
                        <div className="card" style={{ background: 'var(--bg-app)', border: '1px solid var(--accent)', padding: '1.5rem', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                    Talent & Organizational Control
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>Manage your team roster, invite new hires, and assign organizational departments.</p>
                            </div>
                            <Link href="/dashboard/hr" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', textDecoration: 'none', fontWeight: 'bold' }}>
                                Open HR Portal →
                            </Link>
                        </div>
                    )}

                    {/* All-Hands Contextual Data */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', width: '100%' }}>
                        {activeChannel !== 'Finance' && activeChannel !== 'Engineering' && (
                            <SprintManager
                                sprints={startupData?.sprints || []}
                                tasks={filteredTasks}
                                onUpdate={fetchData}
                                isAdmin={isAdmin}
                            />
                        )}
                        {activeChannel === 'General' && (
                            <Roadmap
                                goals={startupData?.goals || []}
                                milestones={startupData?.milestones || []}
                                tasks={rawTasks}
                                isAdmin={isAdmin}
                                onUpdate={fetchData}
                            />
                        )}
                        {activeChannel === 'General' && (
                            <FounderCRM
                                contacts={startupData?.contacts || []}
                                onUpdate={fetchData}
                                isAdmin={isAdmin}
                            />
                        )}
                        {activeChannel === 'Operations' && (
                            <TeamRoster members={startupData?.teamMembers || []} />
                        )}
                    </div>


                    {/* Milestones Row */}
                    <div style={{ width: '100%' }}>
                        <MilestoneTracker
                            milestones={startupData?.milestones || []}
                            onUpdate={fetchData}
                            isAdmin={isAdmin}
                        />
                    </div>
                </>
            )}

            {/* Morning Brief Modal */}
            {briefModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ maxWidth: '600px', width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>☕</span> Chief of Staff Briefing
                            </h3>
                            <button onClick={() => setBriefModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--foreground)' }}>
                            {briefLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', justifyContent: 'center', padding: '2rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>🧠</span> Analyzing runway and execution data...
                                </div>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: morningBrief ? morningBrief.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') : '' }} />
                            )}
                        </div>

                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-primary" onClick={() => setBriefModalOpen(false)} style={{ padding: '0.5rem 1.5rem' }}>Let's Build</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
