'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/utils/api';
import toast from 'react-hot-toast';
import { Clock, Filter, FileText, CheckCircle, Target, ShieldAlert, Award, TrendingUp, Users } from 'lucide-react';

export default function TimelinePage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all'); // 'all' | 'decision' | 'task' | 'milestone' | 'financial' | 'team'

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/startup/memory-events'), {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setEvents(data || []);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load memory timeline');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const getEventIcon = (type) => {
        switch (type) {
            case 'decision': return <FileText size={18} color="var(--accent)" />;
            case 'task': return <CheckCircle size={18} color="#10b981" />;
            case 'milestone': return <Target size={18} color="#06b6d4" />;
            case 'financial': return <TrendingUp size={18} color="#10b981" />;
            case 'team': return <Users size={18} color="#3b82f6" />;
            default: return <Clock size={18} color="#64748b" />;
        }
    };

    const getEventBadgeStyle = (type) => {
        switch (type) {
            case 'decision': return { background: 'var(--accent-subtle)', color: 'var(--accent)' };
            case 'task': return { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
            case 'milestone': return { background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' };
            case 'financial': return { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
            case 'team': return { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
            default: return { background: 'rgba(100, 116, 139, 0.1)', color: '#64748b' };
        }
    };

    const filteredEvents = filterType === 'all' 
        ? events 
        : events.filter(e => e.type === filterType);

    // Group events by Month and Year
    const groupEventsByMonth = (eventList) => {
        const groups = {};
        eventList.forEach(e => {
            const date = new Date(e.timestamp);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(e);
        });
        return groups;
    };

    const groupedEvents = groupEventsByMonth(filteredEvents);

    if (loading) return <div style={{ padding: '2rem' }}>Retrieving explicit memory graph...</div>;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header section */}
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Company Timeline</h1>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>An explicit chronological stream of decisions, completed tasks, milestones, and organization updates.</p>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <button 
                    onClick={() => setFilterType('all')} 
                    style={{ background: filterType === 'all' ? 'var(--accent)' : 'transparent', color: filterType === 'all' ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                    All Events
                </button>
                <button 
                    onClick={() => setFilterType('decision')} 
                    style={{ background: filterType === 'decision' ? 'var(--accent)' : 'transparent', color: filterType === 'decision' ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                    📝 Decisions
                </button>
                <button 
                    onClick={() => setFilterType('task')} 
                    style={{ background: filterType === 'task' ? 'var(--accent)' : 'transparent', color: filterType === 'task' ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                    ✅ Tasks
                </button>
                <button 
                    onClick={() => setFilterType('milestone')} 
                    style={{ background: filterType === 'milestone' ? 'var(--accent)' : 'transparent', color: filterType === 'milestone' ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                    🎯 Milestones
                </button>
                <button 
                    onClick={() => setFilterType('financial')} 
                    style={{ background: filterType === 'financial' ? 'var(--accent)' : 'transparent', color: filterType === 'financial' ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                    💰 Financials
                </button>
                <button 
                    onClick={() => setFilterType('team')} 
                    style={{ background: filterType === 'team' ? 'var(--accent)' : 'transparent', color: filterType === 'team' ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                    👥 Team Updates
                </button>
            </div>

            {/* Timeline Stream */}
            {Object.keys(groupedEvents).length === 0 ? (
                <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', borderStyle: 'dashed' }}>
                    <Clock size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3>No memory events found</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Complete tasks, log decisions, or achieve milestones to populate the timeline.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
                    {/* Vertical line through timeline */}
                    <div style={{ position: 'absolute', left: '20px', top: '20px', bottom: '20px', width: '2px', background: 'var(--border)', zIndex: 0 }}></div>

                    {Object.entries(groupedEvents).map(([monthYear, eventList]) => (
                        <div key={monthYear} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1 }}>
                            
                            {/* Month Header */}
                            <h3 style={{ margin: '0 0 0.5rem 0', paddingLeft: '45px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                                {monthYear}
                            </h3>

                            {/* Events list in Month */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {eventList.map(event => {
                                    const badgeStyle = getEventBadgeStyle(event.type);
                                    return (
                                        <div key={event._id} style={{ display: 'flex', gap: '1.25rem', paddingLeft: '11px', position: 'relative' }}>
                                            
                                            {/* Event node dot */}
                                            <div style={{ 
                                                width: '20px', 
                                                height: '20px', 
                                                borderRadius: '50%', 
                                                background: 'var(--bg-app)', 
                                                border: `2px solid ${badgeStyle.color}`, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                boxShadow: '0 0 0 4px var(--bg-app)',
                                                marginTop: '4px',
                                                zIndex: 2
                                            }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: badgeStyle.color }}></div>
                                            </div>

                                            {/* Event card details */}
                                            <div className="card" style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span style={{ 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center', 
                                                            gap: '0.25rem', 
                                                            background: badgeStyle.background, 
                                                            color: badgeStyle.color, 
                                                            fontSize: '0.7rem', 
                                                            fontWeight: 800, 
                                                            padding: '0.15rem 0.5rem', 
                                                            borderRadius: '50px',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {getEventIcon(event.type)}
                                                            {event.type}
                                                        </span>
                                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{event.title}</h4>
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(event.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {event.detail && (
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                                        {event.detail}
                                                    </p>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
