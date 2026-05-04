'use client';
import { useState, useEffect } from 'react';
import { getApiUrl } from '@/utils/api';

export default function TaskBoard({ tasks, onUpdate, activeChannel, userDepartment, isAdmin }) {
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [filterMine, setFilterMine] = useState(false);
    
    // Task Chat State
    const [chatTaskId, setChatTaskId] = useState(null);
    const [newCommentText, setNewCommentText] = useState('');

    const hasEditAccess = isAdmin || (activeChannel === userDepartment);

    const handleAddComment = async (e, id) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;
        
        try {
            const token = localStorage.getItem('token');
            await fetch(getApiUrl(`/api/startup/tasks/${id}/comments`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ text: newCommentText })
            });
            setNewCommentText('');
            onUpdate(); // Re-fetch dashboard data to show new comment
        } catch (err) {
            console.error('Failed to add comment:', err);
        }
    };

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            setCurrentUser(user);
        } catch (e) { }
    }, []);

    const columns = ['pending', 'in-progress', 'completed'];
    const columnTitles = { 'pending': 'To Do', 'in-progress': 'In Progress', 'completed': 'Done' };

    const handleDragStart = (e, task) => {
        if (!hasEditAccess) return;
        e.dataTransfer.setData('taskId', task._id);
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        if (!hasEditAccess) return;
        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t._id === taskId);
        if (!task || task.status === newStatus) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(getApiUrl(`/api/startup/tasks/${taskId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ status: newStatus })
            });
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditSubmit = async (e, taskId) => {
        e.preventDefault();
        if (!editTitle.trim()) {
            setEditingTaskId(null);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await fetch(getApiUrl(`/api/startup/tasks/${taskId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ title: editTitle })
            });
            setEditingTaskId(null);
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/startup/tasks'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ 
                    title: newTitle, 
                    status: 'pending',
                    department: activeChannel || 'General'
                })
            });
            if (res.ok) {
                setNewTitle('');
                setIsCreating(false);
                onUpdate();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredTasks = filterMine && currentUser ? tasks.filter(t => t.assignee && t.assignee._id === currentUser.id) : tasks;

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {hasEditAccess && !isCreating && (
                        <button onClick={() => setIsCreating(true)} className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                             + New Task
                        </button>
                    )}
                    {hasEditAccess && isCreating && (
                        <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.4rem', borderRadius: '50px', border: '1px solid var(--border)' }}>
                            <input 
                                autoFocus
                                className="form-input" 
                                placeholder="What needs to be done?" 
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                style={{ border: 'none', background: 'transparent', padding: '0.4rem 1rem', width: '280px' }}
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '0.4rem 1rem' }}>Save</button>
                            <button type="button" onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 1rem' }}>Cancel</button>
                        </form>
                    )}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '50px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                    <input type="checkbox" checked={filterMine} onChange={e => setFilterMine(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                    Assigned to me
                </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%' }}>
                {columns.map(col => (
                    <div
                        key={col}
                        className="glass-card"
                        style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', height: '100%', minHeight: '500px' }}
                        onDrop={(e) => handleDrop(e, col)}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>
                                {columnTitles[col]}
                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '50px', marginLeft: '1rem', fontSize: '0.7rem', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                                    {filteredTasks.filter(t => t.status === col).length}
                                </span>
                            </h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            {filteredTasks.filter(t => t.status === col).map(t => (
                                <div
                                    key={t._id}
                                    draggable={editingTaskId !== t._id}
                                    onDragStart={(e) => handleDragStart(e, t)}
                                    onDoubleClick={() => { setEditingTaskId(t._id); setEditTitle(t.title); }}
                                    style={{
                                        background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                        cursor: editingTaskId === t._id ? 'text' : 'grab', transition: 'all 0.2s', position: 'relative'
                                    }}
                                    onDragEnd={(e) => { e.target.style.opacity = '1'; }}
                                    onDrag={(e) => { e.target.style.opacity = '0.5'; }}
                                >
                                    {editingTaskId === t._id ? (
                                        <form onSubmit={(e) => handleEditSubmit(e, t._id)}>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onBlur={(e) => handleEditSubmit(e, t._id)}
                                                style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.95rem' }}
                                            />
                                        </form>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                                <span style={{ fontSize: '0.95rem', lineHeight: '1.5', fontWeight: 500 }}>{t.title}</span>
                                                <button onClick={() => setChatTaskId(t._id)} style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', fontSize: '0.8rem' }}>💬</button>
                                            </div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                {t.assignee ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-funky))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>
                                                            {t.assignee.name?.charAt(0)}
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.assignee.name?.split(' ')[0]}</span>
                                                    </div>
                                                ) : <div />}
                                                
                                                {t.linkedDocs?.length > 0 && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        📚 {t.linkedDocs.length} docs
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODERN TASK MODAL */}
            {chatTaskId && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
                    <div className="glass-card" style={{ maxWidth: '600px', width: '90%', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Discussion Thread</h3>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tasks.find(t => t._id === chatTaskId)?.title}</p>
                            </div>
                            <button onClick={() => setChatTaskId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {tasks.find(t => t._id === chatTaskId)?.comments?.map((c, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-app)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                        {c.user?.name?.charAt(0) || '?'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{c.user?.name || 'Someone'}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{c.text}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <form onSubmit={(e) => handleAddComment(e, chatTaskId)} style={{ padding: '1.5rem 2rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
                            <input 
                                className="form-input" 
                                placeholder="Add a comment..." 
                                value={newCommentText}
                                onChange={e => setNewCommentText(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn-primary" disabled={!newCommentText.trim()}>Post</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
