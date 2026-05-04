import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '@/utils/api';
import ReactMarkdown from 'react-markdown';

export default function AICoFounder() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
        role: 'ai', 
        content: 'Hi! I am your AI Co-Founder. I am plugged into your live financials, team roster, and task backlog. Ask me anything like:\n\n* "Where are we wasting money?"\n* "What should I focus on this week?"\n* "Are we moving fast enough?"' 
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
        setMessages(prev => [...prev, { role: 'ai', content: `**Error:** ${data.message || 'Failed to fetch AI analysis.'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: '**Error:** Server connectivity issue. Check if backend is running.' }]);
    } finally {
      setLoading(false);
    }
  };

    return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2.5rem',
          right: '2.5rem',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          boxShadow: '0 12px 30px rgba(99, 102, 241, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isOpen ? 'rotate(135deg) scale(0.8)' : 'rotate(0) scale(1)'
        }}
        title="AI Co-Founder"
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} />}
      </button>

      {/* Chat Window */}
      <div 
        style={{
          position: 'fixed',
          bottom: '7.5rem',
          right: '2.5rem',
          width: 'min(440px, 90vw)',
          height: '650px',
          background: 'var(--bg-card)',
          backdropFilter: 'var(--glass)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--accent)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Bot size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>AI Partner</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>● Live Context</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-app)',
                padding: '1rem 1.25rem',
                borderRadius: '16px',
                borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: msg.role === 'ai' ? 4 : 16,
                border: '1px solid var(--border)',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)'
              }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', background: 'var(--bg-app)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Analyzing workspace data...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..." 
              style={{
                width: '100%',
                background: 'var(--bg-app)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                padding: '1rem 3.5rem 1rem 1.25rem',
                borderRadius: '50px',
                outline: 'none',
                fontSize: '0.95rem'
              }}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || loading}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: input.trim() ? 'var(--accent)' : 'transparent',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
