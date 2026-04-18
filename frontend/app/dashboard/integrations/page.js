'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Share2, Lock, MessageSquare, CreditCard, RefreshCw } from 'lucide-react';

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState({ stripeKey: '', slackWebhookUrl: '' });
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5001/api/startup', {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (data.integrations) {
                setIntegrations(data.integrations);
            }
        } catch (err) {
            toast.error('Failed to load integrations');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5001/api/startup/integrations', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(integrations)
            });
            if (res.ok) {
                toast.success('Integrations updated successfully');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Update failed');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    const handleSyncStripe = async () => {
        setSyncing(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5001/api/startup/sync-stripe', {
                method: 'POST',
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Stripe synced: $${data.revenue.toLocaleString()} found`);
            } else {
                toast.error(data.message || 'Sync failed');
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading integrations...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ borderBottom: '1px solid var(--border)', pb: '1rem', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Share2 size={32} color="var(--accent)" /> External Integrations
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Connect your external tools to automate your startup operating system and reduce manual data entry.
                </p>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Slack Integration Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <MessageSquare size={24} color="#4A154B" />
                            <h3 style={{ margin: 0 }}>Slack Notifications</h3>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                            Receive real-time alerts on your Slack channel whenever a critical event happens (e.g. Milestone achieved, Runway low).
                        </p>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Incoming Webhook URL</label>
                            <input 
                                type="url" 
                                className="form-input" 
                                placeholder="https://hooks.slack.com/services/..."
                                value={integrations.slackWebhookUrl}
                                onChange={(e) => setIntegrations({ ...integrations, slackWebhookUrl: e.target.value })}
                            />
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

                    {/* Stripe Integration Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <CreditCard size={24} color="#635BFF" />
                            <h3 style={{ margin: 0 }}>Stripe Revenue Sync</h3>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                            Automatically sync your MRR/Revenue from Stripe. Enter your Restricted API Key with 'Charges' read access.
                        </p>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Stripe API Key (rk_test_...)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="password" 
                                    className="form-input" 
                                    placeholder="rk_test_..."
                                    value={integrations.stripeKey}
                                    onChange={(e) => setIntegrations({ ...integrations, stripeKey: e.target.value })}
                                />
                                <button 
                                    type="button"
                                    onClick={handleSyncStripe}
                                    disabled={syncing || !integrations.stripeKey}
                                    className="btn btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                                >
                                    <RefreshCw size={16} className={syncing ? 'spinning' : ''} />
                                    {syncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                         <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <Lock size={14} /> Your keys are stored securely and never shared.
                         </div>
                         <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .spinning {
                    animation: spin 2s linear infinite;
                }
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
