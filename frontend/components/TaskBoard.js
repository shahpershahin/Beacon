'use client';

import { useState, useEffect, useMemo } from 'react';
import { getApiUrl } from '@/utils/api';
import toast from 'react-hot-toast';
import { Search, Plus, MessageSquare, CheckCircle, Clock, AlertCircle, FileText, X } from 'lucide-react';

export default function TaskBoard({ tasks = [], onUpdate, activeChannel = 'General', userDepartment, isAdmin }) {
    const [localTasks, setLocalTasks] = useState(tasks);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newPriority, setNewPriority] = useState('normal');
    const [isCreating, setIsCreating] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [filterMine, setFilterMine] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dragOverCol, setDragOverCol] = useState(null);
    
    // Task Chat State
    const [chatTaskId, setChatTaskId] = useState(null);
    const [newCommentText, setNewCommentText] = useState('');

    const hasEditAccess = isAdmin || (activeChannel === userDepartment) || activeChannel === 'General';

    // Keep local tasks in sync when upstream tasks change
    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                setCurrentUser(JSON.parse(userStr));
            }
        } catch (e) {
            console.error('Error reading current user:', e);
        }
    }, []);

    const columns = [
        { id: 'pending', label: 'To Do', icon: Clock, color: '#f59e0b' },
        { id: 'in-progress', label: 'In Progress', icon: AlertCircle, color: 'var(--accent)' },
        { id: 'completed', label: 'Done', icon: CheckCircle, color: '#10b981' }
    ];

    // Drag handlers
    const handleDragStart = (e, task) => {
        if (!hasEditAccess) return;
        e.dataTransfer.setData('taskId', task._id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, colId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverCol !== colId) {
            setDragOverCol(colId);
        }
    };

    const handleDragLeave = (e, colId) => {
        if (dragOverCol === colId) {
            setDragOverCol(null);
        }
    };

    // Instant optimistic drop
    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        setDragOverCol(null);
        if (!hasEditAccess) return;

        const taskId = e.dataTransfer.getData('taskId');
        const task = localTasks.find(t => t._id === taskId);
        if (!task || task.status === newStatus) return;

        // 1. Optimistic local update (instant response!)
        const previousTasks = [...localTasks];
        const updatedTasks = localTasks.map(t => 
            t._id === taskId ? { ...t, status: newStatus } : t
        );
        setLocalTasks(updatedTasks);
        if (onUpdate) onUpdate(updatedTasks);

        // 2. Background sync
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/startup/tasks/${taskId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                throw new Error('Failed to update task status');
            }
        } catch (err) {
            console.error('Task update failed, reverting:', err);
            toast.error('Failed to sync task change with server.');
            setLocalTasks(previousTasks);
            if (onUpdate) onUpdate(previousTasks);
        }
    };

    // Instant optimistic task editing
    const handleEditSubmit = async (e, taskId) => {
        e.preventDefault();
        const trimmed = editTitle.trim();
        if (!trimmed) {
            setEditingTaskId(null);
            return;
        }

        const previousTasks = [...localTasks];
        const updatedTasks = localTasks.map(t =>
            t._id === taskId ? { ...t, title: trimmed } : t
        );
        setLocalTasks(updatedTasks);
        setEditingTaskId(null);
        if (onUpdate) onUpdate(updatedTasks);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/startup/tasks/${taskId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ title: trimmed })
            });
            if (!res.ok) throw new Error('Update failed');
        } catch (err) {
            toast.error('Failed to rename task.');
            setLocalTasks(previousTasks);
            if (onUpdate) onUpdate(previousTasks);
        }
    };

    // Instant optimistic task creation
    const handleCreateTask = async (e) => {
        e.preventDefault();
        const trimmed = newTitle.trim();
        if (!trimmed) return;

        const tempId = 'temp-' + Date.now();
        const newTaskOptimistic = {
            _id: tempId,
            title: trimmed,
            status: 'pending',
            priority: newPriority,
            department: activeChannel || 'General',
            comments: [],
            linkedDocs: [],
            assignee: currentUser ? { _id: currentUser.id || currentUser._id, name: currentUser.name } : null
        };

        const updatedTasks = [newTaskOptimistic, ...localTasks];
        setLocalTasks(updatedTasks);
        setNewTitle('');
        setIsCreating(false);
        if (onUpdate) onUpdate(updatedTasks);
        toast.success('Task created');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/startup/tasks'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ 
                    title: trimmed, 
                    status: 'pending',
                    priority: newPriority,
                    department: activeChannel || 'General'
                })
            });

            if (res.ok) {
                const createdTask = await res.json();
                // Replace temp ID with actual server ID
                setLocalTasks(prev => prev.map(t => t._id === tempId ? (createdTask.task || createdTask) : t));
            } else {
                throw new Error('Create failed');
            }
        } catch (err) {
            toast.error('Failed to save task to server.');
            setLocalTasks(prev => prev.filter(t => t._id !== tempId));
        }
    };

    // Instant optimistic comment posting
    const handleAddComment = async (e, id) => {
        e.preventDefault();
        const text = newCommentText.trim();
        if (!text) return;

        const newComment = {
            text,
            timestamp: new Date().toISOString(),
            user: currentUser ? { name: currentUser.name, id: currentUser.id || currentUser._id } : { name: 'You' }
        };

        const updatedTasks = localTasks.map(t => {
            if (t._id === id) {
                return {
                    ...t,
                    comments: [...(t.comments || []), newComment]
                };
            }
            return t;
        });

        setLocalTasks(updatedTasks);
        setNewCommentText('');
        if (onUpdate) onUpdate(updatedTasks);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/startup/tasks/${id}/comments`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ text })
            });
            if (!res.ok) throw new Error('Comment failed');
        } catch (err) {
            toast.error('Failed to post comment.');
        }
    };

    // Filtered tasks computation
    const filteredTasks = useMemo(() => {
        return localTasks.filter(t => {
            if (filterMine && currentUser) {
                const isMine = t.assignee && (t.assignee._id === (currentUser.id || currentUser._id) || t.assignee.name === currentUser.name);
                if (!isMine) return false;
            }
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchTitle = t.title?.toLowerCase().includes(query);
                const matchAssignee = t.assignee?.name?.toLowerCase().includes(query);
                if (!matchTitle && !matchAssignee) return false;
            }
            return true;
        });
    }, [localTasks, filterMine, currentUser, searchQuery]);

    const activeChatTask = localTasks.find(t => t._id === chatTaskId);

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Action Bar & Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {hasEditAccess && !isCreating && (
                        <button 
                            onClick={() => setIsCreating(true)} 
                            className="btn-primary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem' }}
                        >
                            <Plus size={16} />
                            <span>New Task</span>
                        </button>
                    )}

                    {hasEditAccess && isCreating && (
                        <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent)', alignItems: 'center' }}>
                            <input 
                                autoFocus
                                className="form-input" 
                                placeholder="What needs to be done?" 
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                style={{ border: 'none', background: 'transparent', padding: '0.4rem 0.75rem', width: '260px', fontSize: '0.85rem' }}
                            />
                            <select 
                                value={newPriority} 
                                onChange={e => setNewPriority(e.target.value)}
                                style={{ border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}
                            >
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="normal">Normal</option>
                                <option value="low">Low</option>
                            </select>
                            <button type="submit" className="btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>Save</button>
                            <button type="button" onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 0.5rem', fontSize: '0.8rem' }}>Cancel</button>
                        </form>
                    )}

                    {/* Fast Filter by Search */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Filter tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.82rem',
                                color: 'var(--text-main)',
                                width: '180px'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-surface)', userSelect: 'none' }}>
                        <input 
                            type="checkbox" 
                            checked={filterMine} 
                            onChange={e => setFilterMine(e.target.checked)} 
                            style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} 
                        />
                        <span>Assigned to me</span>
                    </label>
                </div>
            </div>

            {/* High-Performance Kanban Grid */}
            <div className="kanban-grid">
                {columns.map(col => {
                    const colTasks = filteredTasks.filter(t => t.status === col.id);
                    const isDragTarget = dragOverCol === col.id;
                    const IconComponent = col.icon;

                    return (
                        <div
                            key={col.id}
                            className={`kanban-col ${isDragTarget ? 'drag-over' : ''}`}
                            onDrop={(e) => handleDrop(e, col.id)}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDragLeave={(e) => handleDragLeave(e, col.id)}
                        >
                            {/* Column Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <IconComponent size={15} style={{ color: col.color }} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-main)' }}>
                                        {col.label}
                                    </span>
                                </div>
                                <span style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                    {colTasks.length}
                                </span>
                            </div>

                            {/* Column Tasks List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: '300px' }}>
                                {colTasks.length === 0 ? (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                        Drag tasks here
                                    </div>
                                ) : (
                                    colTasks.map(t => (
                                        <div
                                            key={t._id}
                                            className="task-item-card"
                                            draggable={hasEditAccess && editingTaskId !== t._id}
                                            onDragStart={(e) => handleDragStart(e, t)}
                                            onDoubleClick={() => { 
                                                if (hasEditAccess) {
                                                    setEditingTaskId(t._id); 
                                                    setEditTitle(t.title); 
                                                }
                                            }}
                                        >
                                            {editingTaskId === t._id ? (
                                                <form onSubmit={(e) => handleEditSubmit(e, t._id)}>
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        onBlur={(e) => handleEditSubmit(e, t._id)}
                                                        style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--accent)', padding: '0.4rem', borderRadius: '4px', color: 'var(--text-main)', outline: 'none', fontSize: '0.875rem' }}
                                                    />
                                                </form>
                                            ) : (
                                                <>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                        <span style={{ fontSize: '0.875rem', lineHeight: '1.45', fontWeight: 600, color: 'var(--text-main)' }}>
                                                            {t.title}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setChatTaskId(t._id);
                                                            }} 
                                                            title="Discussion Thread"
                                                            style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', color: 'var(--accent)', cursor: 'pointer', padding: '0.3rem 0.45rem', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                        >
                                                            <MessageSquare size={12} />
                                                            <span>{t.comments?.length || 0}</span>
                                                        </button>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {t.priority && (
                                                                <span className={`badge-priority ${t.priority}`}>
                                                                    {t.priority}
                                                                </span>
                                                            )}
                                                            {t.assignee && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} title={`Assigned to ${t.assignee.name}`}>
                                                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800 }}>
                                                                        {t.assignee.name?.charAt(0) || 'U'}
                                                                    </div>
                                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.assignee.name?.split(' ')[0]}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {t.linkedDocs?.length > 0 && (
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                <FileText size={12} />
                                                                <span>{t.linkedDocs.length}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Notion-style + New item trigger */}
                            {hasEditAccess && (
                                <button
                                    onClick={() => {
                                        setIsCreating(true);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.45rem 0.65rem',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-muted)',
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '0.82rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        marginTop: '0.5rem',
                                        transition: 'all 0.12s ease',
                                        width: '100%'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                                >
                                    <Plus size={14} />
                                    <span>New</span>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Task Discussion Modal */}
            {chatTaskId && activeChatTask && (
                <div 
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '1rem' }}
                    onClick={() => setChatTaskId(null)}
                >
                    <div 
                        className="glass-card" 
                        style={{ maxWidth: '600px', width: '100%', maxHeight: '82vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Task Discussion</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeChatTask.title}</p>
                            </div>
                            <button 
                                onClick={() => setChatTaskId(null)} 
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {(!activeChatTask.comments || activeChatTask.comments.length === 0) ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>
                                    No comments yet. Start the conversation below!
                                </div>
                            ) : (
                                activeChatTask.comments.map((c, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                                            {c.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div style={{ flex: 1, background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{c.user?.name || 'Teammate'}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    {c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.45' }}>{c.text}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <form onSubmit={(e) => handleAddComment(e, chatTaskId)} style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem' }}>
                            <input 
                                className="form-input" 
                                placeholder="Type a message or update..." 
                                value={newCommentText}
                                onChange={e => setNewCommentText(e.target.value)}
                                style={{ flex: 1, padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                            />
                            <button type="submit" className="btn-primary" disabled={!newCommentText.trim()} style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
                                Post
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
