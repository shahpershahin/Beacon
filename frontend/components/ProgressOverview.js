'use client';

export default function ProgressOverview({ tasks, milestones }) {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const taskProgress = tasks.length ? (completedTasks / tasks.length) * 100 : 0;

    const achievedMilestones = milestones.filter(m => m.achieved).length;
    const milestoneProgress = milestones.length ? (achievedMilestones / milestones.length) * 100 : 0;

    const overallHealth = (taskProgress + milestoneProgress) / 2;

    let healthColor = 'var(--danger)';
    let statusText = 'AT RISK';
    if (overallHealth >= 50) { healthColor = 'var(--warning)'; statusText = 'ON TRACK'; }
    if (overallHealth >= 80) { healthColor = 'var(--success)'; statusText = 'EXCELLENT'; }

    return (
        <div className="kpi-widget" style={{ borderLeft: `4px solid ${healthColor}` }}>
            <div className="kpi-label">Execution Health</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <div className="kpi-value" style={{ fontSize: '3.5rem' }}>{Math.round(overallHealth)}%</div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: healthColor, letterSpacing: '0.05em' }}>{statusText}</div>
            </div>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
                <div>
                    <div className="kpi-label" style={{ fontSize: '0.65rem' }}>Tasks</div>
                    <div style={{ fontWeight: '500', fontSize: '1.2rem' }}>{completedTasks}/{tasks.length}</div>
                </div>
                <div>
                    <div className="kpi-label" style={{ fontSize: '0.65rem' }}>Milestones</div>
                    <div style={{ fontWeight: '500', fontSize: '1.2rem' }}>{achievedMilestones}/{milestones.length}</div>
                </div>
            </div>
        </div>
    );
}
