'use client';

import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/utils/api';

const TRIGGERS = [
    { id: 'USER_INVITED', label: 'When a new team member is invited' },
    { id: 'TASK_COMPLETED', label: 'When a Task is completed' }
];

const ACTIONS = [
    { id: 'CREATE_ONBOARDING_TASKS', label: 'Assign Onboarding Tasks to them', triggers: ['USER_INVITED'] },
    { id: 'SLACK_ALERT', label: 'Send a Slack Notification', triggers: ['TASK_COMPLETED'] }
];

export default function AutomationsPage() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New Rule State
    const [isCreating, setIsCreating] = useState(false);
    const [selectedTrigger, setSelectedTrigger] = useState('USER_INVITED');
    const [selectedAction, setSelectedAction] = useState('CREATE_ONBOARDING_TASKS');

    const fetchRules = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/startup/automations'), {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setRules(data);
        } catch (err) {
            toast.error('Failed to load automations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    // Filter available actions based on selected trigger
    const availableActions = ACTIONS.filter(a => a.triggers.includes(selectedTrigger));
    
    useEffect(() => {
        if (!availableActions.find(a => a.id === selectedAction) && availableActions.length > 0) {
            setSelectedAction(availableActions[0].id);
        }
    }, [selectedTrigger, availableActions, selectedAction]);

    const handleCreateRule = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/startup/automations'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({
                    trigger: selectedTrigger,
                    action: selectedAction,
                    active: true
                })
            });
            
            if (res.ok) {
                toast.success('Automation rule instantly active!');
                setIsCreating(false);
                fetchRules();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to create rule');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this automation rule?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/startup/automations/${id}`), {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                fetchRules();
                toast.success('Rule removed');
            }
        } catch (err) {
            toast.error('Failed to delete rule');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading automation engine...</div>;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '2rem' }}>
                        <div style={{ background: 'var(--accent)', padding: '0.75rem', borderRadius: '12px', display: 'flex', color: 'white' }}>
                            <Zap size={24} />
                        </div>
                        Automation Engine
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Build Zapier-style triggers to put your Startup OS on autopilot.</p>
                </div>
                {!isCreating && (
                    <button onClick={() => setIsCreating(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                        <Plus size={18} /> New Rule
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--accent)', background: 'var(--bg-app)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Create Automation Rule</h3>
                    <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>IF THIS HAPPENS...</label>
                            <select 
                                className="form-input"
                                value={selectedTrigger}
                                onChange={(e) => setSelectedTrigger(e.target.value)}
                                style={{ fontSize: '1.1rem', padding: '1rem', background: 'var(--card-bg)' }}
                            >
                                {TRIGGERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <ArrowRight size={24} color="var(--accent)" />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>THEN DO THIS...</label>
                            <select 
                                className="form-input"
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value)}
                                style={{ fontSize: '1.1rem', padding: '1rem', background: 'var(--card-bg)' }}
                            >
                                {availableActions.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setIsCreating(false)} className="btn" style={{ background: 'transparent' }}>Cancel</button>
                            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>Activate Rule</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {rules.length === 0 && !isCreating ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed' }}>
                        <Zap size={48} color="var(--text-muted)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <h3>No Automations Running</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Save hours of busywork by automating your workspace.</p>
                        <button onClick={() => setIsCreating(true)} className="btn-primary">Create First Automation</button>
                    </div>
                ) : (
                    rules.map(rule => (
                        <div key={rule._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                    IF <span style={{ color: 'var(--accent)' }}>{TRIGGERS.find(t => t.id === rule.trigger)?.label}</span>
                                </div>
                                <ArrowRight size={18} color="var(--text-muted)" />
                                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                    THEN <span style={{ color: 'var(--success)' }}>{ACTIONS.find(a => a.id === rule.action)?.label}</span>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(rule._id)} className="btn-icon" style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
