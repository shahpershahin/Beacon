'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [department, setDepartment] = useState('General');
  const [jobTitle, setJobTitle] = useState('Employee');
  const [loading, setLoading] = useState(false);
  const [roster, setRoster] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchRoster = async () => {
      try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:5001/api/startup/members', { headers: { 'x-auth-token': token } });
          const data = await res.json();
          if (Array.isArray(data)) setRoster(data);
      } catch (err) {
          console.error('Failed to load roster:', err);
      }
  };

  useEffect(() => {
      try {
          setCurrentUser(JSON.parse(localStorage.getItem('user')));
          fetchRoster();
      } catch(e) {}
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const loadingToast = toast.loading('Sending invitation...');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/startup/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ email, role, jobTitle, department })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Team member successfully granted access!', { id: loadingToast });
        if (data.tempPassword) {
            toast('Generated Temp Password: ' + data.tempPassword, { icon: '🔐', duration: 10000 });
        }
        setEmail('');
        setRole('Viewer');
        setDepartment('General');
        setJobTitle('Employee');
        fetchRoster();
      } else {
        toast.error(data.message || 'Invitation failed', { id: loadingToast });
      }
    } catch (err) {
      toast.error('Server connectivity error', { id: loadingToast });
    } finally {
      setLoading(false);
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
          const data = await res.json();
          if (res.ok) {
              toast.success('Role updated');
              fetchRoster();
          } else {
              toast.error(data.message || 'Failed to update role');
          }
      } catch (err) {
          toast.error('Server error updating role');
      }
  };

  const handleRemoveMember = async (memberId) => {
      if (!confirm('Are you sure you want to revoke access for this member?')) return;
      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://localhost:5001/api/startup/members/${memberId}`, {
              method: 'DELETE',
              headers: { 'x-auth-token': token }
          });
          const data = await res.json();
          if (res.ok) {
              toast.success('Member removed');
              fetchRoster();
          } else {
              toast.error(data.message || 'Failed to remove member');
          }
      } catch (err) {
          toast.error('Server error removing team member');
      }
  };

  const isCurrentUserAdmin = () => {
      if (!currentUser) return false;
      const match = roster.find(m => m._id === currentUser.id);
      return match ? (match.role === 'Admin' || match.role === 'Founder') : false;
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
        <h3 className="card-title">Technical Integrations</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Configuring webhooks and technical connections for the operating system.
        </p>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Status</label>
            <div style={{ color: 'var(--success)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 600 }}>Active - All Systems Nominal</div>
          </div>
        </div>
      </div>

    </div>
  );
}
