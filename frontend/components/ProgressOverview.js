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
        <div className="kpi-widget" style={{ borderLeft: `4px solid ${healthColor}`, display: 'flex', flexDirection: 'column' }}>
            <div className="kpi-label" style={{ marginBottom: '0.5rem' }}>Execution Health</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <div className="kpi-value" style={{ fontSize: '2.5rem' }}>{Math.round(overallHealth)}%</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: healthColor, letterSpacing: '0.05em' }}>{statusText}</div>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                    <div className="kpi-label" style={{ fontSize: '0.65rem' }}>Tasks Done</div>
                    <div style={{ fontWeight: '500', fontSize: '1.2rem' }}>{completedTasks}/{tasks.length}</div>
                </div>
                <div>
                    <div className="kpi-label" style={{ fontSize: '0.65rem' }}>Milestones</div>
                    <div style={{ fontWeight: '500', fontSize: '1.2rem' }}>{achievedMilestones}/{milestones.length}</div>
                </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--foreground)' }}>🧠 Smart Insights</div>
                {overallHealth < 50 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--danger)' }}>•</span> You are critically behind on execution. Only {Math.round(overallHealth)}% of objectives are met.
                    </div>
                ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--success)' }}>•</span> Execution velocity is stable. Keep pushing pending tasks.
                    </div>
                )}
                {completedTasks < tasks.length - 2 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--warning)' }}>•</span> Too many unfinished tasks piling up on the board.
                    </div>
                )}
            </div>
        </div>
    );
}
