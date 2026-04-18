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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {hasEditAccess && !isCreating && (
                        <button onClick={() => setIsCreating(true)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                             + Quick Add Task
                        </button>
                    )}
                    {hasEditAccess && isCreating && (
                        <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                                autoFocus
                                className="form-input" 
                                placeholder="Task title..." 
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                style={{ minWidth: '250px', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Save</button>
                            <button type="button" onClick={() => setIsCreating(false)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Cancel</button>
                        </form>
                    )}
                    {!hasEditAccess && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-app)', padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                            🔒 View Only ({activeChannel} Channel)
                        </div>
                    )}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={filterMine} onChange={e => setFilterMine(e.target.checked)} style={{ transform: 'scale(1.1)' }} />
                    Show Only My Tasks
                </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
                {columns.map(col => (
                    <div
                        key={col}
                        className="card"
                        style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', height: '100%', minHeight: '350px' }}
                        onDrop={(e) => handleDrop(e, col)}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {columnTitles[col]}
                                <span style={{ background: 'var(--bg-app)', padding: '0.2rem 0.6rem', borderRadius: '12px', marginLeft: '0.75rem', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                                    {filteredTasks.filter(t => t.status === col).length}
                                </span>
                            </h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                            {filteredTasks.filter(t => t.status === col).map(t => (
                                <div
                                    key={t._id}
                                    draggable={editingTaskId !== t._id}
                                    onDragStart={(e) => handleDragStart(e, t)}
                                    onDoubleClick={() => { setEditingTaskId(t._id); setEditTitle(t.title); }}
                                    style={{
                                        background: 'var(--bg-app)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)',
                                        cursor: editingTaskId === t._id ? 'text' : 'grab', fontSize: '0.95rem', color: 'var(--text-main)', transition: 'transform 0.1s',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                    onDragEnd={(e) => { e.target.style.opacity = '1'; }}
                                    onDrag={(e) => { e.target.style.opacity = '0.5'; }}
                                >
                                    {editingTaskId === t._id ? (
                                        <form onSubmit={(e) => handleEditSubmit(e, t._id)} style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onBlur={(e) => handleEditSubmit(e, t._id)}
                                                style={{
                                                    width: '100%', background: 'transparent', border: 'none',
                                                    borderBottom: '1px solid var(--accent)', color: 'var(--text-main)',
                                                    outline: 'none', fontSize: '0.95rem', padding: '0'
                                                }}
                                            />
                                        </form>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <span style={{ wordBreak: 'break-word', flex: 1 }}>{t.title}</span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => setChatTaskId(t._id)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: '0.875rem' }}
                                                    title="Task Chat"
                                                >
                                                    💬 {t.comments?.length > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{t.comments.length}</span>}
                                                </button>
                                                {hasEditAccess && (
                                                    <button
                                                        onClick={() => { setEditingTaskId(t._id); setEditTitle(t.title); }}
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: '0.875rem' }}
                                                        title="Edit task text"
                                                    >
                                                        ✎
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {t.assignee && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <div style={{ background: 'var(--accent)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px' }}>
                                                {t.assignee.name ? t.assignee.name[0].toUpperCase() : '@'}
                                            </div>
                                            {t.assignee.name || t.assignee.email}
                                        </div>
                                    )}
                                    {t.linkedDocs?.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.75rem' }}>
                                            {t.linkedDocs.map(doc => (
                                                <a 
                                                    key={doc._id} 
                                                    href={`/dashboard/wiki?docId=${doc._id}`}
                                                    target="_blank"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'none', background: 'var(--bg-app)', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                                                >
                                                    📚 {doc.title}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {t.department && t.department !== 'General' && activeChannel === 'General' && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', fontWeight: 700, opacity: 0.6, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            🏷️ {t.department}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* TASK CHAT MODAL */}
            {chatTaskId && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--foreground)' }}>
                                💬 Task Thread
                            </h3>
                            <button onClick={() => setChatTaskId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        
                        <div style={{ padding: '1rem 1.5rem', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                            "{tasks.find(t => t._id === chatTaskId)?.title}"
                        </div>
                        
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {tasks.find(t => t._id === chatTaskId)?.comments?.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>No comments yet. Start the discussion!</div>
                            ) : (
                                tasks.find(t => t._id === chatTaskId)?.comments?.map((c, i) => (
                                    <div key={i} style={{ background: 'var(--card-bg)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                            {c.user?.name || c.user?.email || 'User'}
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                                                {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{c.text}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <form onSubmit={(e) => handleAddComment(e, chatTaskId)} style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                            <input 
                                className="form-input" 
                                placeholder="Type a message..." 
                                value={newCommentText}
                                onChange={e => setNewCommentText(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn btn-primary" disabled={!newCommentText.trim()}>Send</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
