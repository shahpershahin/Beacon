'use client';
import { useState } from 'react';

export default function TaskBoard({ tasks, onUpdate }) {
    const [newTask, setNewTask] = useState('');

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5000/api/startup/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ title: newTask })
            });
            setNewTask('');
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleTaskStatus = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/startup/tasks/${task._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: newStatus })
            });
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="card">
            <h3 className="card-title">Tasks</h3>

            <div style={{ marginBottom: '1.5rem' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {tasks.map(t => (
                        <li key={t._id} className="task-row">
                            <input
                                type="checkbox"
                                className="task-checkbox"
                                checked={t.status === 'completed'}
                                onChange={() => toggleTaskStatus(t)}
                            />
                            <span style={{
                                textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                                color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-main)',
                                flex: 1
                            }}>
                                {t.title}
                            </span>
                        </li>
                    ))}
                    {tasks.length === 0 && <li style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0.75rem 0' }}>No tasks assigned.</li>}
                </ul>
            </div>

            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Write a task name..."
                    className="task-input"
                />
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.25rem', whiteSpace: 'nowrap' }}>Add Task</button>
            </form>
        </div>
    );
}
