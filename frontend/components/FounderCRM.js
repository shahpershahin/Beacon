'use client';

import { useState } from 'react';
import { Users, Plus, TrendingUp, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getApiUrl } from '@/utils/api';

export default function FounderCRM({ contacts, onUpdate, isAdmin }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', company: '', type: 'Investor', status: 'Cold' });

    const handleAdd = async () => {
        if (!newContact.name) return toast.error('Name is required');
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(getApiUrl('/api/startup/contacts'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(newContact)
            });
            if (res.ok) {
                toast.success('Lead added to CRM');
                setNewContact({ name: '', company: '', type: 'Investor', status: 'Cold' });
                setIsAdding(false);
                onUpdate();
            }
        } catch (err) {
            toast.error('Failed to add lead');
        }
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(getApiUrl(`/api/startup/contacts/${id}`), {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                toast.success('Lead removed');
                onUpdate();
            }
        } catch (err) {
            toast.error('Failed to remove');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Cold': return 'var(--text-muted)';
            case 'Warm': return 'var(--warning)';
            case 'In-Talks': return 'var(--accent)';
            case 'Commitment': return 'var(--success)';
            case 'Passed': return 'var(--danger)';
            default: return 'var(--text-main)';
        }
    };

    return (
        <div className="card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} color="var(--accent)" /> Founder CRM
                </h3>
                {isAdmin && (
                    <button onClick={() => setIsAdding(!isAdding)} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
                        <Plus size={16} />
                    </button>
                )}
            </div>

            {isAdding && (
                <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border)' }}>
                    <input className="form-input" placeholder="Name" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
                    <input className="form-input" placeholder="Company/Firm" value={newContact.company} onChange={e => setNewContact({...newContact, company: e.target.value})} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select className="form-input" value={newContact.type} onChange={e => setNewContact({...newContact, type: e.target.value})}>
                            <option>Investor</option>
                            <option>Partner</option>
                            <option>Advisor</option>
                            <option>Candidate</option>
                        </select>
                        <select className="form-input" value={newContact.status} onChange={e => setNewContact({...newContact, status: e.target.value})}>
                            <option>Cold</option>
                            <option>Warm</option>
                            <option>In-Talks</option>
                            <option>Commitment</option>
                            <option>Passed</option>
                        </select>
                    </div>
                    <button onClick={handleAdd} className="btn btn-primary">Save Lead</button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {contacts && contacts.length > 0 ? (
                    contacts.map(contact => (
                        <div key={contact._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                    {contact.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{contact.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{contact.company || contact.type}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '12px', background: 'var(--card-bg)', border: `1px solid ${getStatusColor(contact.status)}`, color: getStatusColor(contact.status) }}>
                                    {contact.status.toUpperCase()}
                                </div>
                                {isAdmin && (
                                    <button onClick={() => handleDelete(contact._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                        <TrendingUp size={32} style={{ marginBottom: '1rem' }} />
                        <p style={{ fontSize: '0.85rem' }}>Add investors or partners you're tracking to your CRM.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
