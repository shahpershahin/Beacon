'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/utils/api';
import toast from 'react-hot-toast';
import { Calendar, HelpCircle, CheckCircle, XCircle, AlertCircle, Plus, Eye, Edit3, Trash2 } from 'lucide-react';

const CATEGORIES = ['General', 'Product', 'Pricing', 'Hiring', 'Marketing', 'Financial'];

export default function DecisionsPage() {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'evaluated' | 'all'

    // Form states
    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [expectedOutcome, setExpectedOutcome] = useState('');
    const [confidenceScore, setConfidenceScore] = useState(50);
    const [category, setCategory] = useState('General');
    const [reviewDate, setReviewDate] = useState('');

    // Review Modal States
    const [selectedDecision, setSelectedDecision] = useState(null);
    const [actualOutcome, setActualOutcome] = useState('');
    const [lessonLearned, setLessonLearned] = useState('');
    const [outcomeStatus, setOutcomeStatus] = useState('Success');
    const [impactRevenue, setImpactRevenue] = useState(0);
    const [impactRunway, setImpactRunway] = useState(0);
    const [impactVelocity, setImpactVelocity] = useState(0);

    const fetchDecisions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/startup'), {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setDecisions(data.decisions || []);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to sync decisions ledger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDecisions();
    }, []);

    const handleCreateDecision = async (e) => {
        e.preventDefault();
        if (!title.trim() || !context.trim() || !expectedOutcome.trim() || !reviewDate) {
            toast.error('Please complete all decision tracking fields');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/startup/decisions'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({
                    title,
                    context,
                    expectedOutcome,
                    confidenceScore,
                    category,
                    reviewDate: new Date(reviewDate)
                })
            });

            if (res.ok) {
                toast.success('Decision logged in Company Memory');
                setIsCreating(false);
                setTitle('');
                setContext('');
                setExpectedOutcome('');
                setConfidenceScore(50);
                setCategory('General');
                setReviewDate('');
                fetchDecisions();
            } else {
                const errData = await res.json();
                toast.error(errData.message || 'Failed to save decision');
            }
        } catch (err) {
            toast.error('Connection error');
        }
    };

    const handleOpenReview = (decision) => {
        setSelectedDecision(decision);
        setActualOutcome(decision.actualOutcome || '');
        setLessonLearned(decision.lessonLearned || '');
        setOutcomeStatus(decision.status === 'Pending' ? 'Success' : decision.status);
        setImpactRevenue(decision.impactRevenue || 0);
        setImpactRunway(decision.impactRunway || 0);
        setImpactVelocity(decision.impactVelocity || 0);
    };

    const handleSaveReview = async (e) => {
        e.preventDefault();
        if (!actualOutcome.trim() || !lessonLearned.trim()) {
            toast.error('Outcome review and lesson learned are required');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/startup/decisions/${selectedDecision._id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({
                    actualOutcome,
                    lessonLearned,
                    status: outcomeStatus,
                    impactRevenue,
                    impactRunway,
                    impactVelocity
                })
            });

            if (res.ok) {
                toast.success('Decision evaluation logged');
                setSelectedDecision(null);
                fetchDecisions();
            } else {
                const errData = await res.json();
                toast.error(errData.message || 'Failed to evaluate decision');
            }
        } catch (err) {
            toast.error('Network failure');
        }
    };

    const handleDeleteDecision = async (id) => {
        if (!confirm('Permanently remove this decision from company logs?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/startup/decisions/${id}`), {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                toast.success('Decision purged');
                fetchDecisions();
            } else {
                toast.error('Unauthorized deletion');
            }
        } catch (err) {
            toast.error('Error connecting to backend');
        }
    };

    const now = new Date();
    
    // Sort and filter decisions
    const pendingReviews = decisions.filter(d => d.status === 'Pending');
    const evaluatedDecisions = decisions.filter(d => d.status !== 'Pending');

    // Filter by tab
    const filteredDecisions = activeTab === 'pending'
        ? pendingReviews
        : activeTab === 'evaluated'
        ? evaluatedDecisions
        : decisions;

    const getCategoryColor = (cat) => {
        switch (cat) {
            case 'Product': return 'var(--accent)';
            case 'Pricing': return '#10b981';
            case 'Hiring': return '#06b6d4';
            case 'Marketing': return '#f59e0b';
            case 'Financial': return '#ef4444';
            default: return '#64748b';
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Syncing Decision Intelligence ledger...</div>;

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Decision Journal</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Index decisions, define confidence metrics, evaluate results, and build Company Wisdom.</p>
                </div>
                {!isCreating && (
                    <button onClick={() => setIsCreating(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Track Decision
                    </button>
                )}
            </div>

            {/* Overdue Review Alerts */}
            {decisions.some(d => d.status === 'Pending' && new Date(d.reviewDate) <= now) && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertCircle color="#d97706" size={24} />
                    <div style={{ flex: 1 }}>
                        <strong style={{ color: '#d97706', fontSize: '0.9rem' }}>Evaluation Needed</strong>
                        <p style={{ margin: '0.1rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Some logged decisions have passed their review dates. Evaluate their outcomes to build decision logs.</p>
                    </div>
                </div>
            )}

            {/* Track Decision Form Card */}
            {isCreating && (
                <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--accent)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Log Strategic Decision</h3>
                    <form onSubmit={handleCreateDecision} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }} className="form-group">
                            <label>Decision Title</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Moved subscription pricing from $19 to $29/mo" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Why this decision? (Context / Problem)</label>
                            <textarea 
                                placeholder="e.g. Higher unit margins needed to offset acquisition cost..." 
                                rows={3}
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Expected Outcome</label>
                            <textarea 
                                placeholder="e.g. Increase profitability, less than 5% customer churn..." 
                                rows={3}
                                value={expectedOutcome}
                                onChange={(e) => setExpectedOutcome(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Outcome Review Date</label>
                            <input 
                                type="date" 
                                value={reviewDate}
                                onChange={(e) => setReviewDate(e.target.value)}
                            />
                        </div>

                        <div style={{ gridColumn: 'span 2' }} className="form-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Confidence Level</span>
                                <strong style={{ color: 'var(--accent)' }}>{confidenceScore}%</strong>
                            </label>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={confidenceScore} 
                                onChange={(e) => setConfidenceScore(Number(e.target.value))}
                                style={{ padding: 0 }}
                            />
                        </div>

                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setIsCreating(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" className="btn-primary">Index Decision</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '1.5rem', marginBottom: '0.5rem' }}>
                <button 
                    onClick={() => setActiveTab('pending')} 
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === 'pending' ? '2px solid var(--accent)' : 'none', color: activeTab === 'pending' ? 'var(--text-main)' : 'var(--text-muted)', paddingBottom: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
                >
                    Pending Review ({pendingReviews.length})
                </button>
                <button 
                    onClick={() => setActiveTab('evaluated')} 
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === 'evaluated' ? '2px solid var(--accent)' : 'none', color: activeTab === 'evaluated' ? 'var(--text-main)' : 'var(--text-muted)', paddingBottom: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
                >
                    Evaluated ({evaluatedDecisions.length})
                </button>
                <button 
                    onClick={() => setActiveTab('all')} 
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === 'all' ? '2px solid var(--accent)' : 'none', color: activeTab === 'all' ? 'var(--text-main)' : 'var(--text-muted)', paddingBottom: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
                >
                    All Tracked ({decisions.length})
                </button>
            </div>

            {/* Decisions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredDecisions.length === 0 ? (
                    <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', borderStyle: 'dashed' }}>
                        <HelpCircle size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <h3>No decisions found</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Index your first strategic company choice to start building history logs.</p>
                    </div>
                ) : (
                    filteredDecisions.map(decision => {
                        const isOverdue = decision.status === 'Pending' && new Date(decision.reviewDate) <= now;
                        return (
                            <div 
                                key={decision._id} 
                                className="card" 
                                style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '1.25rem', 
                                    borderLeft: `4px solid ${getCategoryColor(decision.category)}`,
                                    background: isOverdue ? 'rgba(245, 158, 11, 0.02)' : 'var(--bg-surface)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ background: `${getCategoryColor(decision.category)}20`, color: getCategoryColor(decision.category), fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '50px', fontWeight: 800, textTransform: 'uppercase' }}>
                                                {decision.category}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Calendar size={14} /> Logged: {new Date(decision.date).toLocaleDateString()}
                                            </span>
                                            {isOverdue && (
                                                <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '50px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    ⚠️ Overdue
                                                </span>
                                            )}
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{decision.title}</h3>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {decision.status === 'Pending' ? (
                                            <button 
                                                onClick={() => handleOpenReview(decision)} 
                                                className="btn-primary" 
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                            >
                                                <Edit3 size={14} /> Evaluate Outcome
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {decision.status === 'Success' ? (
                                                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 700 }}>
                                                        <CheckCircle size={16} /> Success
                                                    </span>
                                                ) : decision.status === 'Failure' ? (
                                                    <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 700 }}>
                                                        <XCircle size={16} /> Failure
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 700 }}>
                                                        ● Neutral
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteDecision(decision._id)} 
                                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                                            title="Delete decision"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem' }}>
                                    <div>
                                        <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Why it was made:</strong>
                                        {decision.context}
                                    </div>
                                    <div>
                                        <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Expected Outcome:</strong>
                                        {decision.expectedOutcome}
                                    </div>
                                </div>

                                {decision.status !== 'Pending' && (
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                                            <div>
                                                <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Actual Outcome:</strong>
                                                {decision.actualOutcome}
                                            </div>
                                            <div>
                                                <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Lessons Learned:</strong>
                                                {decision.lessonLearned}
                                            </div>
                                        </div>
                                        
                                        {/* Impact telemetry */}
                                        <div style={{ display: 'flex', gap: '1.5rem', background: 'var(--bg-app)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                                            <span style={{ color: decision.impactRevenue >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                Revenue: {decision.impactRevenue >= 0 ? `+${decision.impactRevenue}%` : `${decision.impactRevenue}%`}
                                            </span>
                                            <span style={{ color: decision.impactRunway >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                Runway: {decision.impactRunway >= 0 ? `+${decision.impactRunway}m` : `${decision.impactRunway}m`}
                                            </span>
                                            <span style={{ color: decision.impactVelocity >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                Product Velocity: {decision.impactVelocity >= 0 ? `+${decision.impactVelocity}%` : `${decision.impactVelocity}%`}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                                    <span>Confidence Score: <strong>{decision.confidenceScore}%</strong></span>
                                    <span>Scheduled Review Date: <strong>{new Date(decision.reviewDate).toLocaleDateString()}</strong></span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Evaluate Outcome Modal */}
            {selectedDecision && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ maxWidth: '600px', width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontWeight: 800 }}>Evaluate Decision Outcome</h3>
                            <button onClick={() => setSelectedDecision(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <form onSubmit={handleSaveReview} style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Decision</span>
                                <h4 style={{ margin: '0.2rem 0', fontWeight: 700 }}>{selectedDecision.title}</h4>
                            </div>

                            <div className="form-group">
                                <label>What was the actual outcome?</label>
                                <textarea 
                                    placeholder="Explain in detail what happened..." 
                                    rows={3}
                                    value={actualOutcome}
                                    onChange={(e) => setActualOutcome(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Lessons Learned</label>
                                <textarea 
                                    placeholder="What did we learn? Any mistakes or takeaways?" 
                                    rows={3}
                                    value={lessonLearned}
                                    onChange={(e) => setLessonLearned(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Outcome Classification</label>
                                <select value={outcomeStatus} onChange={(e) => setOutcomeStatus(e.target.value)}>
                                    <option value="Success">Success (Matches or exceeds expected outcome)</option>
                                    <option value="Failure">Failure (Did not meet goal or backfired)</option>
                                    <option value="Neutral">Neutral (Inconclusive / No clear impact)</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Revenue Impact (%)</label>
                                    <input 
                                        type="number" 
                                        value={impactRevenue}
                                        onChange={(e) => setImpactRevenue(Number(e.target.value))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Runway Impact (m)</label>
                                    <input 
                                        type="number" 
                                        value={impactRunway}
                                        onChange={(e) => setImpactRunway(Number(e.target.value))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Velocity Impact (%)</label>
                                    <input 
                                        type="number" 
                                        value={impactVelocity}
                                        onChange={(e) => setImpactVelocity(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setSelectedDecision(null)} style={{ background: 'transparent' }}>Cancel</button>
                                <button type="submit" className="btn-primary">Log Evaluation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
