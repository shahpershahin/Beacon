'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Users, Shield, CheckCircle, ArrowRight, Building, Rocket } from 'lucide-react';
import { getApiUrl } from '@/utils/api';

export default function Onboarding() {
  const router = useRouter();
  const [startupName, setStartupName] = useState('');
  const [teamMembers, setTeamMembers] = useState([{ email: '', jobTitle: 'CTO', role: 'Admin' }]);
  const [generatedCreds, setGeneratedCreds] = useState([]);
  const [step, setStep] = useState(1); // Step 1: Startup Identity, Step 2: Team, Step 3: Done
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token) router.push('/login');
    if (user.startupName) setStartupName(user.startupName);
  }, [router]);

  const handleUpdateStartupName = async (e) => {
    e.preventDefault();
    if (!startupName.trim()) return toast.error('Please enter your startup name');
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(getApiUrl('/api/auth/update'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ startupName })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('user', JSON.stringify(data));
            setStep(2);
            toast.success('Strategy set! Now build your team.');
        }
    } catch (err) {
        toast.error('Failed to update startup name');
    } finally {
        setLoading(false);
    }
  };

  const handleAddRow = () => {
    setTeamMembers([...teamMembers, { email: '', jobTitle: 'Software Engineer', role: 'Viewer' }]);
  };

  const handleUpdateRow = (index, field, value) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };

  const handleRemoveRow = (index) => {
    const updated = [...teamMembers];
    updated.splice(index, 1);
    setTeamMembers(updated);
  };

  const handleInviteTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    const validMembers = teamMembers.filter(m => m.email.trim());
    
    if (validMembers.length === 0) {
        setStep(3);
        setLoading(false);
        return;
    }

    const token = localStorage.getItem('token');
    const creds = [];
    
    for (const member of validMembers) {
        try {
            const res = await fetch(getApiUrl('/api/startup/invite'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ email: member.email, role: member.role, jobTitle: member.jobTitle })
            });
            const data = await res.json();
            if (res.ok && data.tempPassword) {
                creds.push({ email: member.email, password: data.tempPassword });
            }
        } catch (err) {
            console.error('Failed to invite:', member.email);
        }
    }
    
    setGeneratedCreds(creds);
    setLoading(false);
    setStep(3);
    if (creds.length > 0) toast.success('Team provisioned successfully!');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 1rem', background: 'var(--bg-app)' }}>
      <div className="card" style={{ maxWidth: '800px', width: '100%', padding: '3rem 2rem' }}>
        
        {/* Step Indicators */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
            {[1, 2, 3].map(s => (
                <div key={s} style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', background: step >= s ? 'var(--accent)' : 'var(--bg-app)',
                    border: '1px solid var(--border)', display: 'grid', placeContent: 'center', fontSize: '0.875rem', fontWeight: 600,
                    color: step >= s ? 'white' : 'var(--text-muted)', transition: 'all 0.3s'
                }}>{s}</div>
            ))}
        </div>

        {step === 1 && (
            <div style={{ textAlign: 'center' }}>
                <Building size={48} style={{ color: 'var(--accent)', margin: '0 auto 1.5rem auto' }} />
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Name your Workspace</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>This is the identity your team will see in their dashboard.</p>
                
                <form onSubmit={handleUpdateStartupName}>
                    <div className="form-group" style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
                        <label>Startup Name</label>
                        <input
                            type="text"
                            required
                            value={startupName}
                            onChange={(e) => setStartupName(e.target.value)}
                            className="form-input"
                            placeholder="e.g. Acme Corp"
                            autoFocus
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem 3rem' }}>
                        {loading ? 'Saving...' : 'Continue to Team'} <ArrowRight size={18} style={{ display: 'inline', marginLeft: '0.5rem' }} />
                    </button>
                </form>
            </div>
        )}
        
        {step === 2 && (
            <>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <Users size={48} style={{ color: 'var(--accent)', margin: '0 auto 1.5rem auto' }} />
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Invite your co-founders</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Build your founding team to share metrics, tracking, and milestones.</p>
                </div>
                
                <form onSubmit={handleInviteTeam}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        {teamMembers.map((member, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input 
                                    type="email" 
                                    value={member.email} 
                                    onChange={(e) => handleUpdateRow(idx, 'email', e.target.value)} 
                                    placeholder="founder@startup.com" 
                                    className="form-input" 
                                    style={{ flex: 2 }}
                                />
                                <input 
                                    type="text" 
                                    value={member.jobTitle} 
                                    onChange={(e) => handleUpdateRow(idx, 'jobTitle', e.target.value)} 
                                    placeholder="CTO" 
                                    className="form-input" 
                                    style={{ flex: 1 }}
                                />
                                <select 
                                    value={member.role} 
                                    onChange={(e) => handleUpdateRow(idx, 'role', e.target.value)} 
                                    className="form-input" 
                                    style={{ flex: 1, background: 'var(--bg-app)', color: 'var(--text-main)' }}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                                <button type="button" onClick={() => handleRemoveRow(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
                            </div>
                        ))}
                    </div>
                    
                    <button type="button" onClick={handleAddRow} style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-muted)', width: '100%', padding: '1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2.5rem', fontWeight: 600 }}>
                        + Add another member
                    </button>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button type="button" onClick={() => { setStep(3); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Skip for now</button>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                            {loading ? 'Provisioning...' : 'Provision Accounts'} <ArrowRight size={16} style={{ display: 'inline', marginLeft: '0.5rem', verticalAlign: 'middle' }} />
                        </button>
                    </div>
                </form>
            </>
        )}

        {step === 3 && (
            <div style={{ textAlign: 'center' }}>
                <Rocket size={56} style={{ color: 'var(--success)', margin: '0 auto 1.5rem auto' }} />
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Workspace Ready!</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>{startupName} has been configured successfully.</p>
                
                {generatedCreds.length > 0 && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--danger)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2.5rem', textAlign: 'left' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginTop: 0, marginBottom: '1rem' }}><Shield size={20} /> Secure Temporary Passwords</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.5 }}>
                            We generated temporary accounts for your team. Copy and send these passwords directly—this is the only time you will see them.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {generatedCreds.map((cred, i) => (
                                <li key={i} style={{ background: 'var(--bg-app)', padding: '0.75rem 1rem', borderRadius: '4px', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                                    <span>{cred.email}</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{cred.password}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <button onClick={() => router.push('/dashboard')} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                    Enter Dashboard
                </button>
            </div>
        )}
      </div>
    </div>
  );
}

