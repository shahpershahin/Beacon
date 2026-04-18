'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Users, UserPlus, Shield, Briefcase, Trash2, Mail } from 'lucide-react';

export default function HRPortal() {
    const router = useRouter();
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteLoading, setInviteLoading] = useState(false);

    // Invite Form
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Viewer');
    const [department, setDepartment] = useState('General');
    const [jobTitle, setJobTitle] = useState('');

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            // Check access first manually on frontend to prevent flicker
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await fetch('http://localhost:5001/api/startup', {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();

            const accessRole = (data.role || data.userRole || '').toLowerCase();
            if (accessRole !== 'admin' && accessRole !== 'hr' && accessRole !== 'founder') {
                router.push('/dashboard');
                return;
            }

            const rosterRes = await fetch('http://localhost:5001/api/startup/members', {
                headers: { 'x-auth-token': token }
            });
            const rosterData = await rosterRes.json();
            setRoster(rosterData);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!email) return;
        setInviteLoading(true);
        const loadingToast = toast.loading('Processing invitation...');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5001/api/startup/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ email, role, jobTitle, department })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Team member invited!', { id: loadingToast });
                if (data.tempPassword) {
                    toast('Temp Password: ' + data.tempPassword, { icon: '🔐', duration: 8000 });
                }
                setEmail('');
                setJobTitle('');
                fetchData();
            } else {
                toast.error(data.message || 'Invitation failed', { id: loadingToast });
            }
        } catch (err) {
            toast.error('Network error', { id: loadingToast });
        } finally {
            setInviteLoading(false);
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5001/api/startup/members/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                toast.success('Role updated');
                fetchData();
            }
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm('Revoke all access for this member?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5001/api/startup/members/${memberId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                toast.success('Access revoked');
                fetchData();
            }
        } catch (err) {
            toast.error('Removal failed');
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Securing connection...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>HR & Talent Portal</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Securely manage your startup's human capital and organizational structure.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="stat-badge" style={{ background: 'var(--bg-app)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <strong>{roster.length}</strong> Active Members
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                {/* Team Roster Section */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Users size={20} color="var(--accent)" />
                        <h3 style={{ margin: 0 }}>Company Roster</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {roster.map(member => (
                            <div key={member._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '12px', transition: 'transform 0.2s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent)' }}>
                                        {(member.name || member.email)[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{member.name} {member.role === 'Founder' ? '👑' : ''}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Briefcase size={12} /> {member.jobTitle || member.role} • <Mail size={12} /> {member.email}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'var(--card-bg)', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                        {member.department || 'General'}
                                    </div>
                                    {member.role !== 'Founder' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleUpdateRole(member._id, e.target.value)}
                                                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}
                                            >
                                                <option value="Viewer">Viewer</option>
                                                <option value="HR">HR Manager</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                            <button onClick={() => handleRemoveMember(member._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>System Root</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Invite Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ background: 'var(--bg-app)', border: '1px solid var(--accent)', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <UserPlus size={20} color="var(--accent)" />
                            <h3 style={{ margin: 0 }}>Onboard Member</h3>
                        </div>
                        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Work Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@startup.com" className="form-input" required />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Job Title</label>
                                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Architect" className="form-input" required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Department</label>
                                    <select value={department} onChange={e => setDepartment(e.target.value)} className="form-input">
                                        <option value="General">General</option>
                                        <option value="Engineering">Engineering</option>
                                        <option value="Design">Design</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Growth">Growth</option>
                                        <option value="Operations">Operations</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Access Role</label>
                                    <select value={role} onChange={e => setRole(e.target.value)} className="form-input">
                                        <option value="Viewer">Viewer</option>
                                        <option value="HR">HR Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" disabled={inviteLoading} className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }}>
                                {inviteLoading ? 'Onboarding...' : 'Send Access Keys'}
                            </button>
                        </form>
                    </div>

                    <div className="card" style={{ opacity: 0.8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Shield size={20} color="var(--warning)" />
                            <h4 style={{ margin: 0 }}>Permission Alert</h4>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            HR Managers can manage staff and invite candidates, but cannot view strategic financial telemetry or edit integration keys.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
