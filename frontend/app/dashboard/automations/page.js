'use client';

import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, ArrowRight, Sparkles, LayoutGrid, CheckCircle } from 'lucide-react';
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

const BLUEPRINT_TEMPLATES = [
    { id: 'DEVELOPER_ONBOARDING', label: 'Engineer Onboarding Flow' },
    { id: 'PRODUCT_HUNT_LAUNCH', label: 'Product Hunt Launch Prep' },
    { id: 'SEED_FUNDRAISING', label: 'Seed Round Preparation' },
    { id: 'CUSTOM', label: 'Custom Operations Blueprint' }
];

export default function AutomationsPage() {
    const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'blueprints'
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New Rule State
    const [isCreating, setIsCreating] = useState(false);
    const [selectedTrigger, setSelectedTrigger] = useState('USER_INVITED');
    const [selectedAction, setSelectedAction] = useState('CREATE_ONBOARDING_TASKS');

    // Blueprint Generator States
    const [selectedTemplate, setSelectedTemplate] = useState('DEVELOPER_ONBOARDING');
    const [customPrompt, setCustomPrompt] = useState('');
    const [bpLoading, setBpLoading] = useState(false);
    const [generatedBlueprint, setGeneratedBlueprint] = useState(null);
    const [bpDeploying, setBpDeploying] = useState(false);

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

    // Blueprint Generation & Deployment
    const handleGenerateBlueprint = async (e) => {
        e.preventDefault();
        setBpLoading(true);
        setGeneratedBlueprint(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/ai/generate-blueprint'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({
                    type: selectedTemplate,
                    customPrompt: selectedTemplate === 'CUSTOM' ? customPrompt : undefined
                })
            });
            if (res.ok) {
                const data = await res.json();
                setGeneratedBlueprint(data);
                toast.success('Blueprint checklists generated!');
            } else {
                toast.error('Failed to generate blueprint');
            }
        } catch (err) {
            toast.error('AI server connection failed');
        } finally {
            setBpLoading(false);
        }
    };

    const handleDeployBlueprint = async () => {
        if (!generatedBlueprint) return;
        setBpDeploying(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/startup/deploy-blueprint'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(generatedBlueprint)
            });
            if (res.ok) {
                toast.success('Checklist deployed to active board!');
                setGeneratedBlueprint(null);
            } else {
                toast.error('Deployment restricted');
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setBpDeploying(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading automation engine...</div>;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Page Title */}
            <div>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '2rem' }}>
                    <div style={{ background: 'var(--accent)', padding: '0.75rem', borderRadius: '12px', display: 'flex', color: 'white' }}>
                        <Zap size={24} />
                    </div>
                    Operations Hub
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Put your startup operations on autopilot with rules and custom blueprints.</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '1.5rem', marginBottom: '0.5rem' }}>
                <button 
                    onClick={() => setActiveTab('rules')} 
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === 'rules' ? '2px solid var(--accent)' : 'none', color: activeTab === 'rules' ? 'var(--text-main)' : 'var(--text-muted)', paddingBottom: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
                >
                    Triggers & Actions
                </button>
                <button 
                    onClick={() => setActiveTab('blueprints')} 
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === 'blueprints' ? '2px solid var(--accent)' : 'none', color: activeTab === 'blueprints' ? 'var(--text-main)' : 'var(--text-muted)', paddingBottom: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
                >
                    AI Workflow Blueprints
                </button>
            </div>

            {/* TAB 1: Rules Engine */}
            {activeTab === 'rules' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>Zapier-style Rules</h3>
                        {!isCreating && (
                            <button onClick={() => setIsCreating(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
                                <Plus size={16} /> New Rule
                            </button>
                        )}
                    </div>

                    {isCreating && (
                        <div className="card" style={{ padding: '2rem', border: '1px solid var(--accent)', background: 'var(--bg-app)' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0' }}>Create Automation Rule</h3>
                            <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>IF THIS HAPPENS...</label>
                                    <select 
                                        className="form-input"
                                        value={selectedTrigger}
                                        onChange={(e) => setSelectedTrigger(e.target.value)}
                                        style={{ fontSize: '1rem', padding: '0.8rem', background: 'var(--bg-surface)' }}
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
                                        style={{ fontSize: '1rem', padding: '0.8rem', background: 'var(--bg-surface)' }}
                                    >
                                        {availableActions.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setIsCreating(false)} className="btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn-primary">Activate Rule</button>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                            IF <span style={{ color: 'var(--accent)' }}>{TRIGGERS.find(t => t.id === rule.trigger)?.label}</span>
                                        </div>
                                        <ArrowRight size={18} color="var(--text-muted)" />
                                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>
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
            )}

            {/* TAB 2: AI Workflows */}
            {activeTab === 'blueprints' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={20} color="var(--accent)" /> AI Operations Blueprint Generator
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Select an operational playbook or type a custom command. Beacon will draft structured milestones and task sets.</p>
                        
                        <form onSubmit={handleGenerateBlueprint} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Template Playbook</label>
                                <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                                    {BLUEPRINT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                            </div>

                            {selectedTemplate === 'CUSTOM' && (
                                <div className="form-group">
                                    <label>What operational workflow do you want to design?</label>
                                    <textarea 
                                        placeholder="e.g. Design a checklist for launching a marketing campaign on LinkedIn or preparing GDPR security controls..." 
                                        rows={3}
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                    />
                                </div>
                            )}

                            <button type="submit" disabled={bpLoading} className="btn-primary" style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles size={16} /> {bpLoading ? 'Generating Playbook...' : 'Generate Playbook'}
                            </button>
                        </form>
                    </div>

                    {/* Render generated blueprint */}
                    {generatedBlueprint && (
                        <div className="glass-card" style={{ border: '1px solid var(--success)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 800 }}>Generated Operations Structure</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Checklist holds {generatedBlueprint.tasks?.length || 0} tasks and {generatedBlueprint.milestones?.length || 0} milestones.
                                    </span>
                                </div>
                                <button 
                                    onClick={handleDeployBlueprint} 
                                    disabled={bpDeploying} 
                                    className="btn-primary"
                                    style={{ background: 'var(--success)' }}
                                >
                                    {bpDeploying ? 'Deploying...' : 'Deploy to Active Board'}
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                {/* Milestones column */}
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        🎯 Target Milestones
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {generatedBlueprint.milestones?.map((m, idx) => (
                                            <div key={idx} style={{ background: 'var(--bg-app)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{m.description}</div>
                                                <span style={{ display: 'inline-block', fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 800, background: 'rgba(99,102,241,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                                                    Target: T+{m.daysFromStart || 30} days
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tasks column */}
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        📋 Playbook Tasks
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {generatedBlueprint.tasks?.map((t, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-app)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                <CheckCircle size={16} color="var(--text-muted)" />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dept: {t.department || 'General'}</div>
                                                </div>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                    T+{t.daysFromStart || 5}d
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
