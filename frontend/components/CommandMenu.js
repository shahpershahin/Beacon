'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, BookOpen, Brain, Calendar, ShieldAlert, Award, Play, Users, Settings } from 'lucide-react';

const ACTIONS = [
  { id: 'overview', title: 'Go to Overview', icon: BookOpen, path: '/dashboard' },
  { id: 'brain', title: 'Go to Founder Brain', icon: Brain, path: '/dashboard/founder-brain' },
  { id: 'decisions', title: 'Go to Decisions Journal', icon: ShieldAlert, path: '/dashboard/decisions' },
  { id: 'timeline', title: 'Go to Company Timeline', icon: Calendar, path: '/dashboard/timeline' },
  { id: 'search', title: 'Go to Search & Ask Q&A', icon: Search, path: '/dashboard/memory' },
  { id: 'investor', title: 'Go to Investor Mode', icon: Award, path: '/dashboard/investor' },
  { id: 'automations', title: 'Go to Automations & Playbooks', icon: Play, path: '/dashboard/automations' },
  { id: 'team', title: 'Go to Team Hub (HR)', icon: Users, path: '/dashboard/hr' },
  { id: 'manage', title: 'Go to Manage Workspace', icon: Settings, path: '/dashboard/manage' }
];

export default function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // Toggle open/close with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Set focus on input when menu opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Let modal render first
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter actions based on search
  const filteredActions = ACTIONS.filter(action =>
    action.title.toLowerCase().includes(query.toLowerCase())
  );

  const showAskOption = query.trim().length > 0;

  // Total options is filtered actions + optional "Ask Beacon" option
  const totalOptions = filteredActions.length + (showAskOption ? 1 : 0);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectOption(selectedIndex);
    }
  };

  const selectOption = (index) => {
    if (index < filteredActions.length) {
      const selected = filteredActions[index];
      router.push(selected.path);
    } else if (showAskOption) {
      // Ask Beacon redirect
      router.push(`/dashboard/memory?q=${encodeURIComponent(query)}`);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 9, 11, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '12vh',
      zIndex: 10000,
      animation: 'fadeIn 0.15s ease-out'
    }}>
      <div 
        ref={menuRef}
        style={{
          background: '#18181b', // level 1 surface
          border: '1px solid #27272a', // zinc-800 borders
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          overflow: 'hidden',
          boxShadow: '0 24px 50px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search header */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #27272a', padding: '0 1.25rem' }}>
          <Search size={18} color="#a1a1aa" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or ask a question..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '1.25rem 0.75rem',
              color: '#fafafa',
              fontSize: '1rem',
              outline: 'none',
              boxShadow: 'none'
            }}
          />
          <div style={{
            fontSize: '0.7rem',
            background: '#27272a',
            color: '#a1a1aa',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            flexShrink: 0
          }}>ESC</div>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '0.5rem' }}>
          {/* Actions */}
          {filteredActions.map((action, idx) => {
            const Icon = action.icon;
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={action.id}
                onClick={() => selectOption(idx)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  color: isSelected ? '#fafafa' : '#a1a1aa',
                  background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  fontSize: '0.9rem',
                  fontWeight: isSelected ? 600 : 500
                }}
              >
                <Icon size={16} color={isSelected ? 'var(--accent)' : '#71717a'} />
                <span style={{ flex: 1 }}>{action.title}</span>
                <span style={{ fontSize: '0.75rem', color: '#71717a', opacity: isSelected ? 1 : 0 }}>Jump →</span>
              </div>
            );
          })}

          {/* Ask Co-Founder Query option */}
          {showAskOption && (
            <div
              onClick={() => selectOption(filteredActions.length)}
              onMouseEnter={() => setSelectedIndex(filteredActions.length)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: selectedIndex === filteredActions.length ? '#fafafa' : '#a1a1aa',
                background: selectedIndex === filteredActions.length ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: selectedIndex === filteredActions.length ? '1px solid rgba(255, 255, 255, 0.18)' : '1px dashed transparent',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                fontSize: '0.9rem',
                fontWeight: selectedIndex === filteredActions.length ? 600 : 500,
                marginTop: '0.25rem'
              }}
            >
              <Sparkles size={16} color="var(--accent)" />
              <span style={{ flex: 1 }}>
                Ask Beacon Co-Founder: <strong style={{ color: '#fafafa' }}>"{query}"</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Query AI ⚡</span>
            </div>
          )}

          {filteredActions.length === 0 && !showAskOption && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#71717a', fontSize: '0.9rem' }}>
              No matches found.
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div style={{
          borderTop: '1px solid #27272a',
          padding: '0.75rem 1.25rem',
          fontSize: '0.75rem',
          color: '#71717a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(9, 9, 11, 0.2)'
        }}>
          <span>Use <span style={{ color: '#a1a1aa', fontWeight: 600 }}>↑↓</span> keys to navigate, <span style={{ color: '#a1a1aa', fontWeight: 600 }}>Enter</span> to select.</span>
          <span>Press <kbd style={{ background: '#27272a', color: '#a1a1aa', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.65rem' }}>⌘ K</kbd> anywhere</span>
        </div>
      </div>
    </div>
  );
}
