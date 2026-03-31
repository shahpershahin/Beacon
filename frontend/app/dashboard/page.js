'use client';

import { useEffect, useState } from 'react';
import TaskBoard from '@/components/TaskBoard';
import MilestoneTracker from '@/components/MilestoneTracker';
import FinancialTracker from '@/components/FinancialTracker';
import ProgressOverview from '@/components/ProgressOverview';

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

            {/* Top Geckoboard KPIs Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <ProgressOverview tasks={startupData?.tasks || []} milestones={startupData?.milestones || []} />
                <FinancialTracker financials={startupData?.financials || {}} onUpdate={fetchData} />
            </div>

            {/* Bottom Asana Lists Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                <TaskBoard tasks={startupData?.tasks || []} onUpdate={fetchData} />
                <MilestoneTracker milestones={startupData?.milestones || []} onUpdate={fetchData} />
            </div>

        </div>
    );
}
