'use client';
import { useState } from 'react';

export default function Settings() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        setStatus({ type: '', msg: '' });

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/startup/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', msg: 'Team member successfully granted access!' });
                setEmail('');
            } else {
                setStatus({ type: 'error', msg: data.message || 'Invitation failed' });
            }
        } catch (err) {
            setStatus({ type: 'error', msg: 'Server connectivity error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div className="card">
                <h3 className="card-title">Startup Profile</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Manage your startup details and basic tracker configurations.
                </p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Workspace Name (Read Only)</label>
                        <input type="text" value="Primary Dashboard" disabled className="form-input" style={{ marginTop: '0.5rem', opacity: 0.7 }} />
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="card-title">Team Access</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Invite team members to collaborate on your tasks, milestones, and financial metrics.
                    Invited members must be existing registered users of the platform before you invite them.
                </p>

                <form onSubmit={handleInvite} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Team member's registered email address..."
                            className="form-input"
                            required
                        />
                        {status.msg && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: status.type === 'error' ? 'var(--danger)' : 'var(--success)', fontWeight: '500' }}>
                                {status.msg}
                            </div>
                        )}
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.62rem 1.75rem', height: 'fit-content' }}>
                        {loading ? 'Inviting...' : 'Invite'}
                    </button>
                </form>
            </div>

        </div>
    );
}
