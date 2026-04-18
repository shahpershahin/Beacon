import { Users, Briefcase, Mail, Shield, Code, Palette, DollarSign, TrendingUp, Settings, HelpCircle } from 'lucide-react';

export default function TeamRoster({ members }) {
    const departments = ['Engineering', 'Design', 'Finance', 'Operations', 'Growth', 'General'];

    const getDeptIcon = (dept) => {
        switch(dept) {
            case 'Engineering': return <Code size={12} />;
            case 'Design': return <Palette size={12} />;
            case 'Finance': return <DollarSign size={12} />;
            case 'Growth': return <TrendingUp size={12} />;
            case 'Operations': return <Settings size={12} />;
            default: return <HelpCircle size={12} />;
        }
    };

    const getDeptColor = (dept) => {
        switch(dept) {
            case 'Engineering': return '#3b82f6'; // Blue
            case 'Design': return '#ec4899'; // Pink
            case 'Finance': return '#10b981'; // Green
            case 'Growth': return '#8b5cf6'; // Violet
            case 'Operations': return '#f59e0b'; // Amber
            default: return 'var(--accent)';
        }
    };

    return (
        <div className="card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} color="var(--accent)" /> Team Roster
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{members?.length || 0} Members Total</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {departments.map(dept => {
                    const deptMembers = members?.filter(m => (m.department || 'General') === dept);
                    if (deptMembers?.length === 0) return null;

                    return (
                        <div key={dept}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getDeptColor(dept) }}></div>
                                {dept} Team
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {deptMembers.map((member, idx) => (
                                    <div key={idx} style={{ background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                                        {/* Corner Dept Icon */}
                                        <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: getDeptColor(dept), padding: '0.5rem', borderRadius: '50%', color: 'white', opacity: 0.1 }}>
                                            {getDeptIcon(dept)}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ 
                                                width: '36px', 
                                                height: '36px', 
                                                borderRadius: '50%', 
                                                background: 'var(--card-bg)', 
                                                border: `1px solid ${getDeptColor(dept)}44`, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                fontWeight: 'bold', 
                                                color: getDeptColor(dept),
                                                fontSize: '0.8rem'
                                            }}>
                                                {((member.name || member.email) || '?')[0].toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {member.name || (member.email ? member.email.split('@')[0] : 'Unknown')}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <span style={{ color: getDeptColor(dept) }}>{getDeptIcon(dept)}</span>
                                                    {member.jobTitle || 'Team Member'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                                                <Mail size={10} /> {member.email}
                                            </div>
                                            {(member.role === 'Admin' || member.role === 'HR') && (
                                                <Shield size={12} color="var(--warning)" title={`${member.role} Privileges`} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
