'use client';

import { useState } from 'react';
import { getApiUrl } from '@/utils/api';
import toast from 'react-hot-toast';
import { Search, Sparkles, MessageSquare, List, CheckCircle, FileText, Target, Users, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function MemorySearchPage() {
    const [query, setQuery] = useState('');
    const [searchHits, setSearchHits] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Q&A states
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [qaLoading, setQaLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/startup/search?q=${encodeURIComponent(query)}`), {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setSearchHits(data);
            } else {
                toast.error('Search failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error connecting to search engine');
        } finally {
            setLoading(false);
        }
    };

    const handleAskBeacon = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        // Perform implicit raw search first to feed matches to AI context
        setQaLoading(true);
        setAnswer('');
        try {
            const token = localStorage.getItem('token');
            // 1. Fetch search context
            const searchRes = await fetch(getApiUrl(`/api/startup/search?q=${encodeURIComponent(question)}`), {
                headers: { 'x-auth-token': token }
            });
            
            if (!searchRes.ok) {
                setAnswer('Failed to retrieve context logs from database.');
                setQaLoading(false);
                return;
            }
            
            const results = await searchRes.json();

            // 2. Query Gemini Citing Q&A
            const qaRes = await fetch(getApiUrl('/api/ai/search-answer'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({
                    query: question,
                    searchResults: results
                })
            });

            if (qaRes.ok) {
                const qaData = await qaRes.json();
                setAnswer(qaData.answer);
            } else {
                setAnswer('Error compiling response from generative AI co-founder.');
            }
        } catch (err) {
            console.error(err);
            setAnswer('Server connection failure.');
        } finally {
            setQaLoading(false);
        }
    };

    const getHitIcon = (type) => {
        switch (type) {
            case 'task': return <CheckCircle size={16} color="#10b981" />;
            case 'decision': return <FileText size={16} color="var(--accent)" />;
            case 'milestone': return <Target size={16} color="#06b6d4" />;
            case 'contact': return <Users size={16} color="#f59e0b" />;
            case 'wiki': return <BookOpen size={16} color="#3b82f6" />;
            default: return <Search size={16} />;
        }
    };

    const hasHits = searchHits && (
        searchHits.tasks?.length > 0 ||
        searchHits.decisions?.length > 0 ||
        searchHits.milestones?.length > 0 ||
        searchHits.contacts?.length > 0 ||
        searchHits.wiki?.length > 0
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Page Header */}
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Memory Search & Ask</h1>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Search raw workspace tables directly, or ask our citing memory engine to answer questions based on company history.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                
                {/* Left Panel: Ask Beacon Q&A */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        <Sparkles size={22} color="var(--accent)" />
                        <h3 style={{ margin: 0, fontWeight: 800 }}>Ask Beacon Intelligence</h3>
                    </div>

                    <form onSubmit={handleAskBeacon} style={{ display: 'flex', gap: '0.75rem' }}>
                        <input 
                            type="text" 
                            placeholder="e.g. Why did we change pricing to $29?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            style={{ borderRadius: '50px', background: 'var(--bg-app)', flex: 1 }}
                        />
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={qaLoading}
                            style={{ borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            Ask
                        </button>
                    </form>

                    <div style={{ flex: 1, minHeight: '300px', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', overflowY: 'auto' }}>
                        {qaLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', height: '100%', justifyContent: 'center' }}>
                                <Sparkles size={18} className="animate-float" />
                                <span>Scanning company history and synthesizing answers...</span>
                            </div>
                        ) : answer ? (
                            <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                                <ReactMarkdown>{answer}</ReactMarkdown>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                                <MessageSquare size={36} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <h4 style={{ margin: 0 }}>Ask anything about decisions, logs, or milestones</h4>
                                <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0' }}>Beacon will query matching database records, compile them, and generate answers citing the sources.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Raw Database Search */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        <List size={22} color="var(--accent)" />
                        <h3 style={{ margin: 0, fontWeight: 800 }}>Raw Database Search</h3>
                    </div>

                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
                        <input 
                            type="text" 
                            placeholder="e.g. Stripe, launch, pricing, candidate..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ borderRadius: '50px', background: 'var(--bg-app)', flex: 1 }}
                        />
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={loading}
                            style={{ borderRadius: '50px' }}
                        >
                            Search
                        </button>
                    </form>

                    <div style={{ flex: 1, minHeight: '300px', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', height: '100%', justifyContent: 'center' }}>
                                Searching database...
                            </div>
                        ) : searchHits ? (
                            !hasHits ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                    No database matches found.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {Object.entries(searchHits).map(([category, hits]) => {
                                        if (!hits || hits.length === 0) return null;
                                        return (
                                            <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                                                    {category} ({hits.length})
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {hits.map(hit => (
                                                        <div key={hit.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                                                            {getHitIcon(hit.type)}
                                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {hit.title}
                                                                </div>
                                                                {hit.subtitle && (
                                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {hit.subtitle}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                                <Search size={36} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <h4 style={{ margin: 0 }}>Query the company records</h4>
                                <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0' }}>Results will pull directly from tasks, decisions, wiki pages, CRM and milestones.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
