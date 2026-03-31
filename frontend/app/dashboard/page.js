'use client';

import { useEffect, useState } from 'react';
import TaskBoard from '@/components/TaskBoard';
import MilestoneTracker from '@/components/MilestoneTracker';
import FinancialTracker from '@/components/FinancialTracker';
import ProgressOverview from '@/components/ProgressOverview';
import StartupChart from '@/components/StartupChart';

export default function Dashboard() {
    const [startupData, setStartupData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/startup', {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setStartupData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '3rem', color: 'var(--text-muted)' }}>Loading metrics...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Analytics Chart Row */}
            <div style={{ width: '100%' }}>
                <StartupChart financials={startupData?.financials || {}} />
            </div>

            {/* Top Geckoboard KPIs Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <ProgressOverview tasks={startupData?.tasks || []} milestones={startupData?.milestones || []} />
                <FinancialTracker financials={startupData?.financials || {}} onUpdate={fetchData} />
            </div>

            {/* Full Width Kanban Board Row */}
            <div style={{ width: '100%' }}>
                <TaskBoard tasks={startupData?.tasks || []} onUpdate={fetchData} />
            </div>

            {/* Milestones Row */}
            <div style={{ width: '100%' }}>
                <MilestoneTracker milestones={startupData?.milestones || []} onUpdate={fetchData} />
            </div>

        </div>
    );
}
