'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/utils/api';

export default function Profile() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setCurrentUser(user);
            setName(user.name || '');
        }
    } catch(e) {}
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading('Updating profile...');

    const payload = {};
    if (name) payload.name = name;
    if (password) payload.password = password;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl('/api/auth/update'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Profile updated!', { id: loadingToast });
        localStorage.setItem('user', JSON.stringify(data)); // Update local storage identity
        setCurrentUser(data);
        setPassword(''); // Clear the password field
        // Dispatch custom event to trigger navbar update
        window.dispatchEvent(new Event('storage'));
      } else {
        toast.error(data.message || 'Update failed', { id: loadingToast });
      }
    } catch (err) {
      toast.error('Server connectivity error', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="card">
        <h3 className="card-title">Personal Account Settings</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Update your display name and rotate your password securely.
        </p>

        <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Email Address (Read Only)</label>
            <input type="text" value={currentUser?.email || ''} disabled className="form-input" style={{ marginTop: '0.5rem', opacity: 0.7 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>Your email uniquely identifies your account and cannot be changed here.</span>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="form-input" 
              style={{ marginTop: '0.5rem' }} 
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>New Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="form-input" 
              style={{ marginTop: '0.5rem' }} 
              placeholder="Leave blank to keep current password"
              minLength={6}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>Ensure your password is at least 6 characters long.</span>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            {loading ? 'Saving...' : 'Save Profile Details'}
          </button>
        </form>
      </div>

    </div>
  );
}
