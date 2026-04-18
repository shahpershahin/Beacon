'use client';

export default function MilestoneTracker({ milestones, onUpdate, isAdmin }) {
    const toggleAchieved = async (m) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5001/api/startup/milestones/${m._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ achieved: !m.achieved })
            });
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const achievedCount = milestones.filter(m => m.achieved).length;
    const progressPercent = milestones.length ? (achievedCount / milestones.length) * 100 : 0;

    return (
        <div className="card">
            <h3 className="card-title">Milestones</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, background: 'var(--bg-app)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        background: 'var(--accent)',
                        width: `${progressPercent}%`,
                        transition: 'width 0.5s ease-out'
                    }}></div>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{achievedCount}/{milestones.length}</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0' }}>
                {milestones.map(m => (
                    <li key={m._id} className="task-row">
                        <div
                            style={{
                                width: '18px', height: '18px', borderRadius: '4px',
                                background: m.achieved ? 'var(--success)' : 'var(--bg-app)',
                                border: m.achieved ? 'none' : '1px solid var(--border)',
                                display: 'grid', placeContent: 'center', cursor: isAdmin ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                opacity: !isAdmin && !m.achieved ? 0.3 : 1
                            }}
                            onClick={() => isAdmin && toggleAchieved(m)}
                        >
                            {m.achieved && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                        </div>
                        <span style={{
                            color: m.achieved ? 'var(--text-muted)' : 'var(--text-main)',
                            fontWeight: m.achieved ? 'normal' : '500',
                            textDecoration: m.achieved ? 'line-through' : 'none'
                        }}>
                            {m.title}
                        </span>
                    </li>
                ))}
                {milestones.length === 0 && <li style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No milestones set.</li>}
            </ul>
        </div>
    );
}
