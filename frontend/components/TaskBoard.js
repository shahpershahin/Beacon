'use client';
import { useState, useEffect } from 'react';

export default function TaskBoard({ tasks, onUpdate, activeChannel, userDepartment, isAdmin }) {
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [filterMine, setFilterMine] = useState(false);

    const hasEditAccess = isAdmin || (activeChannel === userDepartment);

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
            await fetch(`http://localhost:5001/api/startup/tasks/${taskId}`, {
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
            await fetch(`http://localhost:5001/api/startup/tasks/${taskId}`, {
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
            const res = await fetch('http://localhost:5001/api/startup/tasks', {
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
                                            <span style={{ wordBreak: 'break-word' }}>{t.title}</span>
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
                                    )}
                                    {t.assignee && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <div style={{ background: 'var(--accent)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px' }}>
                                                {t.assignee.name ? t.assignee.name[0].toUpperCase() : '@'}
                                            </div>
                                            {t.assignee.name || t.assignee.email}
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
        </div>
    );
}
