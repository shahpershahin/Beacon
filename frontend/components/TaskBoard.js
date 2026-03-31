'use client';
import { useState } from 'react';

export default function TaskBoard({ tasks, onUpdate }) {
    const [newTask, setNewTask] = useState('');
    const [addingColumn, setAddingColumn] = useState(null);

    const columns = ['pending', 'in-progress', 'completed'];
    const columnTitles = { 'pending': 'To Do', 'in-progress': 'In Progress', 'completed': 'Done' };

    const handleAddTask = async (e, status) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5000/api/startup/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ title: newTask, status })
            });
            setNewTask('');
            setAddingColumn(null);
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDragStart = (e, task) => {
        e.dataTransfer.setData('taskId', task._id);
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t._id === taskId);
        if (!task || task.status === newStatus) return;

        // Optimistically update UI
        // For a simple app, we can just wait for API, but here we update backend and refetch
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/startup/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ status: newStatus })
            });
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // necessary to allow dropping
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
            {columns.map(col => (
                <div
                    key={col}
                    className="card"
                    style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', height: '100%', minHeight: '350px' }}
                    onDrop={(e) => handleDrop(e, col)}
                    onDragOver={handleDragOver}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {columnTitles[col]}
                            <span style={{ background: 'var(--bg-app)', padding: '0.2rem 0.6rem', borderRadius: '12px', marginLeft: '0.75rem', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                                {tasks.filter(t => t.status === col).length}
                            </span>
                        </h3>
                        <button onClick={() => { setAddingColumn(col); setNewTask(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>+</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                        {tasks.filter(t => t.status === col).map(t => (
                            <div
                                key={t._id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, t)}
                                style={{
                                    background: 'var(--bg-app)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)',
                                    cursor: 'grab', fontSize: '0.95rem', color: 'var(--text-main)', transition: 'transform 0.1s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onDragEnd={(e) => { e.target.style.opacity = '1'; }}
                                onDrag={(e) => { e.target.style.opacity = '0.5'; }}
                            >
                                {t.title}
                            </div>
                        ))}

                        {addingColumn === col && (
                            <form onSubmit={(e) => handleAddTask(e, col)}>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    onBlur={() => { if (!newTask) setAddingColumn(null); }}
                                    placeholder="Task title..."
                                    className="form-input"
                                    style={{ background: 'var(--bg-app)' }}
                                />
                            </form>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
