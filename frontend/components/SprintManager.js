'use client';

import { useState } from 'react';
import { Rocket, Calendar, Plus, Trophy } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SprintManager({ sprints, tasks, onUpdate, isAdmin }) {
    const activeSprint = sprints?.find(s => s.active);
    const [isCreating, setIsCreating] = useState(false);
    const [theme, setTheme] = useState('');

    const sprintTasks = activeSprint ? tasks.filter(t => t.sprintId === activeSprint._id) : [];
    const completedTasks = sprintTasks.filter(t => t.status === 'completed').length;
    const progress = sprintTasks.length ? Math.round((completedTasks / sprintTasks.length) * 100) : 0;

    const handleCreateSprint = async () => {
        if (!theme) return toast.error('Please enter a sprint theme');
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5001/api/startup/sprints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ theme, active: true })
            });
            if (res.ok) {
                toast.success('New Sprint Started! 🚀');
                setTheme('');
                setIsCreating(false);
                onUpdate();
            }
        } catch (err) {
            toast.error('Failed to create sprint');
        }
    };

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Rocket size={20} color="var(--accent)" /> Current Sprint
                </h3>
                {isAdmin && !activeSprint && !isCreating && (
                    <button onClick={() => setIsCreating(true)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Start Sprint
                    </button>
                )}
            </div>

            {isCreating ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input 
                        className="form-input" 
                        placeholder="Sprint Theme (e.g. Launch Beta)" 
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                    />
                    <button onClick={handleCreateSprint} className="btn btn-primary">Initialize Sprint</button>
                    <button onClick={() => setIsCreating(false)} className="btn btn-secondary">Cancel</button>
                </div>
            ) : activeSprint ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>THEME</div>
                        <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{activeSprint.theme}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Velocity Progress</span>
                            <span style={{ fontWeight: 600 }}>{progress}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--success))', transition: 'width 0.5s ease' }}></div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{completedTasks}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DONE</div>
                        </div>
                        <div style={{ background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{sprintTasks.length}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SCOPE</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6, padding: '2rem' }}>
                    <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <p style={{ margin: 0, textAlign: 'center', fontSize: '0.9rem' }}>No active sprint. Start one to focus your team.</p>
                </div>
            )}
        </div>
    );
}
