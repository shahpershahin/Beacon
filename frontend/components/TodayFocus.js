import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export default function TodayFocus({ tasks }) {
    const activeTasks = tasks.filter(t => t.status !== 'completed');
    const priorityTasks = activeTasks.slice(0, 3); // grabs first 3

    return (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔥</span>
                <h3 className="card-title" style={{ margin: 0, color: 'var(--foreground)' }}>Today's Focus</h3>
            </div>
            
            {priorityTasks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No pending tasks! You are completely clear for today.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {priorityTasks.map(task => (
                        <div key={task._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            {task.status === 'in_progress' ? <AlertCircle size={18} color="var(--warning)" /> : <Circle size={18} color="var(--text-muted)" />}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>{task.title}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: {task.status.replace('_', ' ')}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
