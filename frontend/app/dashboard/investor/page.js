'use client';

import { useState } from 'react';
import { getApiUrl } from '@/utils/api';
import toast from 'react-hot-toast';
import { Send, FileText, Clipboard, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function InvestorPage() {
    const [updateText, setUpdateText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setUpdateText('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/api/ai/investor-update'), {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setUpdateText(data.update);
                toast.success('Board update prepared!');
            } else {
                toast.error('Failed to compile data metrics');
            }
        } catch (err) {
            console.error(err);
            toast.error('Network connection issue');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!updateText) return;
        navigator.clipboard.writeText(updateText);
        toast.success('Markdown copied to clipboard!');
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Investor Mode</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Compile active financials, task completions, and milestones into a polished board update.</p>
                </div>
                {!loading && (
                    <button 
                        onClick={handleGenerate} 
                        className="btn-primary" 
                    >
                        <Sparkles size={16} /> Generate Board Update
                    </button>
                )}
            </div>

            {/* Generated update card */}
            <div className="glass-card" style={{ flex: 1, minHeight: '450px', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={16} /> Update Markdown Content
                    </span>
                    {updateText && (
                        <button 
                            onClick={handleCopy} 
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                            <Clipboard size={16} /> Copy Update
                        </button>
                    )}
                </div>

                <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', height: '100%', justifyContent: 'center' }}>
                            <Sparkles size={18} className="animate-float" />
                            <span>Compiling runway metrics and completed milestones...</span>
                        </div>
                    ) : updateText ? (
                        <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)' }} className="markdown-content">
                            <ReactMarkdown>{updateText}</ReactMarkdown>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 2rem' }}>
                            <Send size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                            <h3 style={{ margin: 0 }}>No updates compiled</h3>
                            <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 1.5rem 0', maxWidth: '400px' }}>Save hours of monthly writing. Beacon pulls live performance indices and translates them into an executive newsletter update.</p>
                            <button onClick={handleGenerate} className="btn-primary">Generate First Report</button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
