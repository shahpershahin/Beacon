'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Terminal, Sparkles } from 'lucide-react';
import { getApiUrl } from '@/utils/api';
import ReactMarkdown from 'react-markdown';

export default function AICoFounder() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
        role: 'ai', 
        content: 'Beacon Co-Founder Engine initialized. Connected to live financials, backlog, and team velocity. What would you like to analyze?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Keyboard shortcut: Cmd+J or Ctrl+J to toggle AI Advisor
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    const handleOpenEvent = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openAICoFounder', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openAICoFounder', handleOpenEvent);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl('/api/ai/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ prompt: userMessage })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'ai', content: data.result }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `**Error:** ${data.message || 'Failed to fetch analysis.'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: '**Error:** Server connectivity issue. Check backend status.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        width: 'min(440px, 94vw)',
        height: '560px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Terminal size={14} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>Co-Founder Advisory</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Press Esc or ⌘J to close</span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            style={{ 
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              background: m.role === 'user' ? '#0284c7' : 'var(--bg-app)',
              color: m.role === 'user' ? '#fff' : 'var(--text-main)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.85rem',
              fontSize: '0.82rem',
              lineHeight: '1.45'
            }}
          >
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', animation: 'pulse 1s infinite' }}></span>
            <span>Analyzing startup data...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', background: 'var(--bg-app)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about burn, runway, backlog..."
          style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.82rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', outline: 'none' }}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
