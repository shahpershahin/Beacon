'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ManageData() {
    const [financials, setFinancials] = useState({ revenue: 0, funding: 0, burnRate: 0 });
    const [newTask, setNewTask] = useState('');
    const [taskAssignee, setTaskAssignee] = useState('');
    const [teamMembers, setTeamMembers] = useState([]);
    const [newMilestone, setNewMilestone] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5001/api/startup', { headers: { 'x-auth-token': token } });
                const data = await res.json();
                if (data.financials) {
                    setFinancials({
                        revenue: data.financials.revenue || 0,
                        funding: data.financials.funding || 0,
                        burnRate: data.financials.burnRate || 0
                    });
                }

                const membersRes = await fetch('http://localhost:5001/api/startup/members', { headers: { 'x-auth-token': token } });
                const membersData = await membersRes.json();
                setTeamMembers(Array.isArray(membersData) ? membersData : []);
            } catch (err) { }
        };
        fetchData();
    }, []);

    const handleUpdateFinancials = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const req = await fetch('http://localhost:5001/api/startup/financials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({
                    revenue: Number(financials.revenue),
                    funding: Number(financials.funding),
                    burnRate: Number(financials.burnRate)
                })
            });
            const data = await req.json();
            if (!req.ok) throw new Error(data.message || 'Error syncing financials');
            toast.success('Financial metrics saved!');
        } catch (err) {
            toast.error(err.message || 'Network error syncing financials.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        const loadingToast = toast.loading('Deploying task...');
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5001/api/startup/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ title: newTask, status: 'pending', assignee: taskAssignee || undefined })
            });
            setNewTask('');
            toast.success('Task dispatched to Kanban!', { id: loadingToast });
        } catch (err) {
            toast.error('Failed to link Task.', { id: loadingToast });
        }
    };

    const handleAddMilestone = async (e) => {
        e.preventDefault();
        if (!newMilestone.trim()) return;
        const loadingToast = toast.loading('Recording milestone...');
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5001/api/startup/milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ title: newMilestone })
            });
            setNewMilestone('');
            toast.success('Milestone set!', { id: loadingToast });
        } catch (err) {
            toast.error('Milestone error.', { id: loadingToast });
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

            {/* Update Financials */}
            <div className="card">
                <h3 className="card-title">Upload Core Financials</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Mutate revenue and runway targets manually here. Enforced Admin-only.</p>
                <form onSubmit={handleUpdateFinancials} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Revenue ($)</label>
                        <input type="number" className="form-input" value={financials.revenue} onChange={e => setFinancials({ ...financials, revenue: e.target.value })} style={{ marginTop: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Funding ($)</label>
                        <input type="number" className="form-input" value={financials.funding} onChange={e => setFinancials({ ...financials, funding: e.target.value })} style={{ marginTop: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Monthly Burn Rate ($)</label>
                        <input type="number" className="form-input" value={financials.burnRate} onChange={e => setFinancials({ ...financials, burnRate: e.target.value })} style={{ marginTop: '0.5rem' }} />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem' }}>Synchronize Finances</button>
                </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Add Task */}
                <div className="card">
                    <h3 className="card-title">Assign New Action Task</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Tasks fall into the To Do column initially.</p>
                    <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="text" className="form-input" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Type a task objective..." required />
                        <select className="form-input" value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}>
                            <option value="">Unassigned</option>
                            {teamMembers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
                        </select>
                        <button type="submit" className="btn-primary" style={{ padding: '0.62rem 1.5rem', alignSelf: 'flex-start' }}>Deploy Task</button>
                    </form>
                </div>

                {/* Add Milestone */}
                <div className="card">
                    <h3 className="card-title">Plant a New Milestone</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Major achievements for your startup.</p>
                    <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="text" className="form-input" value={newMilestone} onChange={e => setNewMilestone(e.target.value)} placeholder="Type a new milestone..." required />
                        <button type="submit" className="btn-primary" style={{ padding: '0.62rem 1.5rem', alignSelf: 'flex-start' }}>Record Milestone</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
