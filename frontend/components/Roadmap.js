'use client';

import { Target, Flag, CheckCircle, Circle, ChevronRight, MoreVertical, Plus } from 'lucide-react';
import { useState } from 'react';
import { getApiUrl } from '@/utils/api';

export default function Roadmap({ goals = [], milestones = [], tasks = [], isAdmin, onUpdate }) {
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');

    const handleAddGoal = async () => {
        if (!newGoalTitle) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(getApiUrl('/api/startup/goals'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ title: newGoalTitle })
            });
            if (res.ok) {
                setNewGoalTitle('');
                setIsAddingGoal(false);
                onUpdate();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="card" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Target size={22} color="var(--accent)" /> Strategic Roadmap
                </h3>
                {isAdmin && (
                    <button onClick={() => setIsAddingGoal(true)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        + Add Goal
                    </button>
                )}
            </div>

            {isAddingGoal && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                    <input 
                        type="text" 
                        value={newGoalTitle} 
                        onChange={e => setNewGoalTitle(e.target.value)} 
                        placeholder="What's the big target? (e.g. $10k MRR)"
                        className="form-input"
                        autoFocus
                    />
                    <button onClick={handleAddGoal} className="btn-primary">Add</button>
                    <button onClick={() => setIsAddingGoal(false)} className="btn">Cancel</button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {goals.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No strategic goals set yet. Start by defining your high-level vision.</div>}
                
                {goals.map(goal => (
                    <div key={goal._id} style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '1.5rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Core Goal</div>
                                <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{goal.title}</h4>
                            </div>
                            <span style={{ fontSize: '0.75rem', background: 'var(--bg-app)', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>{goal.priority} Priority</span>
                        </div>

                        {/* Milestones for this Goal */}
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {milestones.filter(m => m.goalId === goal._id).map(milestone => (
                                <div key={milestone._id} style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600 }}>
                                            <Flag size={16} color="var(--success)" opacity={milestone.achieved ? 1 : 0.5} />
                                            {milestone.title}
                                        </div>
                                        {milestone.achieved && <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 800 }}>ACHIEVED</span>}
                                    </div>

                                    {/* Tasks for this Milestone */}
                                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {tasks.filter(t => t.milestoneId === milestone._id).map(task => (
                                            <div key={task._id} style={{ fontSize: '0.75rem', background: 'var(--card-bg)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {task.status === 'completed' ? <CheckCircle size={12} color="var(--success)" /> : <Circle size={12} />}
                                                {task.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
