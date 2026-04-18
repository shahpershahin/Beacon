import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
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
      const res = await fetch('http://localhost:5001/api/ai/analyze', {
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
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0)' : 'scale(1)'
        }}
        title="Open AI Co-Founder"
      >
        <Sparkles size={28} />
      </button>

      {/* Chat Window */}
      <div 
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '380px',
          height: '550px',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--accent)', padding: '0.5rem', borderRadius: '8px', color: 'white', display: 'flex' }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>AI Co-Founder</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', display: 'inline-block' }}></span> Active
              </span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Messages Stage */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              <div 
                style={{
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--card-bg)',
                  color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  borderBottomRightRadius: msg.role === 'user' ? 0 : '12px',
                  borderBottomLeftRadius: msg.role === 'ai' ? 0 : '12px',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}
              >
                  {msg.role === 'ai' ? (
                      <div className="markdown-ai">
                          <ReactMarkdown components={{
                              p: ({node, ...props}) => <p style={{margin: '0 0 0.5rem 0'}} {...props} />,
                              ul: ({node, ...props}) => <ul style={{margin: '0.5rem 0', paddingLeft: '1rem'}} {...props} />,
                              li: ({node, ...props}) => <li style={{marginBottom: '0.25rem'}} {...props} />
                          }}>
                              {msg.content}
                          </ReactMarkdown>
                      </div>
                  ) : (
                      msg.content
                  )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', background: 'var(--card-bg)', padding: '0.75rem 1rem', borderRadius: '12px', borderBottomLeftRadius: 0, border: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="typing-dot"></div>
              <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
              <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {!loading && messages.length === 1 && (
            <div style={{ padding: '0 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem', scrollbarWidth: 'none' }}>
                <button onClick={() => setInput("What's our biggest execution bottleneck right now?")} style={{ whiteSpace: 'nowrap', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '12px', cursor: 'pointer' }}>Analyze Execution</button>
                <button onClick={() => setInput("Calculate our runway strictly based on active burn.")} style={{ whiteSpace: 'nowrap', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '12px', cursor: 'pointer' }}>Check Runway</button>
            </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', background: 'var(--bg-app)' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI Co-Founder..." 
            style={{
              flex: 1,
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              padding: '0.75rem 1rem',
              borderRadius: '24px',
              outline: 'none',
              fontSize: '0.9rem'
            }}
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            style={{
              background: input.trim() ? 'var(--accent)' : 'var(--card-bg)',
              color: input.trim() ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s'
            }}
          >
            <Send size={18} style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </div>

    </>
  );
}
