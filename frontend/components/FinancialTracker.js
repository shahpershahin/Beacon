'use client';
import { useState } from 'react';

export default function FinancialTracker({ financials, onUpdate }) {
    const [formData, setFormData] = useState({
        revenue: financials?.revenue || 0,
        funding: financials?.funding || 0,
        burnRate: financials?.burnRate || 0
    });
    const [isEditing, setIsEditing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5000/api/startup/financials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({
                    revenue: Number(formData.revenue),
                    funding: Number(formData.funding),
                    burnRate: Number(formData.burnRate)
                })
            });
            setIsEditing(false);
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    const runway = financials?.burnRate ? Math.floor((financials?.funding || 0) / financials.burnRate) : '∞';

    return (
        <>
            {isEditing ? (
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-title">Edit Financials <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button></div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Revenue ($)</label>
                            <input type="number" className="form-input" value={formData.revenue} onChange={e => setFormData({ ...formData, revenue: e.target.value })} style={{ marginTop: '0.5rem' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Funding ($)</label>
                            <input type="number" className="form-input" value={formData.funding} onChange={e => setFormData({ ...formData, funding: e.target.value })} style={{ marginTop: '0.5rem' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Monthly Burn Rate ($)</label>
                            <input type="number" className="form-input" value={formData.burnRate} onChange={e => setFormData({ ...formData, burnRate: e.target.value })} style={{ marginTop: '0.5rem' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem' }}>Save Metrics</button>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    <div className="kpi-widget">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="kpi-label">Annual Revenue</div>
                            <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>✎</button>
                        </div>
                        <div className="kpi-value" style={{ color: 'var(--success)' }}>${(financials?.revenue || 0).toLocaleString()}</div>
                    </div>

                    <div className="kpi-widget">
                        <div className="kpi-label">Total Funding</div>
                        <div className="kpi-value">${(financials?.funding || 0).toLocaleString()}</div>
                    </div>

                    <div className="kpi-widget">
                        <div className="kpi-label">Runway</div>
                        <div className="kpi-value" style={{ color: runway < 6 && runway !== '∞' ? 'var(--danger)' : 'var(--text-main)' }}>
                            {runway} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>mo</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Burn: ${(financials?.burnRate || 0).toLocaleString()}/mo</div>
                    </div>
                </>
            )}
        </>
    );
}
