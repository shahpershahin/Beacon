'use client';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function StartupChart({ financials }) {
    // We use current financials to generate a visually engaging projection 
    // since the schema doesn't log time-series data out of the box yet.
    const currentRev = financials?.revenue || 0;
    const currentFund = financials?.funding || 0;

    const mockData = [
        { name: 'Month 1', revenue: Math.round(currentRev * 0.1), funding: Math.round(currentFund * 0.2) },
        { name: 'Month 2', revenue: Math.round(currentRev * 0.2), funding: Math.round(currentFund * 0.4) },
        { name: 'Month 3', revenue: Math.round(currentRev * 0.35), funding: Math.round(currentFund * 0.5) },
        { name: 'Month 4', revenue: Math.round(currentRev * 0.55), funding: Math.round(currentFund * 0.6) },
        { name: 'Month 5', revenue: Math.round(currentRev * 0.8), funding: Math.round(currentFund * 0.9) },
        { name: 'Current', revenue: currentRev, funding: currentFund },
    ];

    return (
        <div className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title">Financial Growth Map</h3>
            <div style={{ flex: 1, width: '100%', minHeight: 0, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorFund" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value > 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-main)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                            itemStyle={{ color: 'var(--text-main)' }}
                            formatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '0.875rem', paddingTop: '15px' }} />
                        <Area type="monotone" dataKey="funding" name="Total Funding" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorFund)" />
                        <Area type="monotone" dataKey="revenue" name="Annual Revenue" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
