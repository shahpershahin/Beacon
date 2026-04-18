import { useState } from 'react';
import { Plus, Target, CheckSquare, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';

export default function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '6.5rem', zIndex: 999 }}>
      {isOpen && (
        <div style={{ 
            position: 'absolute', 
            bottom: '4.5rem', 
            right: '0', 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            minWidth: '200px'
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', padding: '0.5rem 1rem' }}>Quick Actions</span>
          <Link href="/dashboard/manage" onClick={() => setIsOpen(false)} className="quick-action-link">
            <CheckSquare size={16} color="var(--accent)" /> Add Task
          </Link>
          <Link href="/dashboard/manage" onClick={() => setIsOpen(false)} className="quick-action-link">
            <Target size={16} color="var(--success)" /> Add Milestone
          </Link>
          <Link href="/dashboard/manage" onClick={() => setIsOpen(false)} className="quick-action-link">
            <DollarSign size={16} color="var(--danger)" /> Update Financials
          </Link>
          <Link href="/dashboard/hr" onClick={() => setIsOpen(false)} className="quick-action-link">
            <Users size={16} color="var(--warning)" /> Invite Team
          </Link>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-app)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isOpen ? 'rotate(45deg) scale(0.95)' : 'rotate(0)'
        }}
        title="Quick Actions"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
