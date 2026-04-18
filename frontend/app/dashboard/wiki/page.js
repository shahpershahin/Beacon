'use client';

import { useState, useEffect } from 'react';
import { Book, Plus, Search, FileText, Clock, ChevronRight, Tag, Link as LinkIcon, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WikiPage() {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Editor State
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editCategory, setEditCategory] = useState('General');

    const fetchDocs = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5001/api/docs', {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setDocs(data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to load knowledge base');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    const handleCreateNew = () => {
        setSelectedDoc(null);
        setEditTitle('New Document');
        setEditContent('');
        setEditCategory('General');
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editTitle) return toast.error('Title is required');
        const token = localStorage.getItem('token');
        const url = selectedDoc ? `http://localhost:5001/api/docs/${selectedDoc._id}` : 'http://localhost:5001/api/docs';
        const method = selectedDoc ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ title: editTitle, content: editContent, category: editCategory })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(selectedDoc ? 'Document updated' : 'Document created');
                setIsEditing(false);
                fetchDocs();
                if (!selectedDoc) setSelectedDoc(data);
            }
        } catch (err) {
            toast.error('Save failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5001/api/docs/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                toast.success('Document deleted');
                setSelectedDoc(null);
                setIsEditing(false);
                fetchDocs();
            }
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const filteredDocs = docs.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Task Linking State
    const [tasks, setTasks] = useState([]);
    
    // Fetch tasks to populate dropdown
    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('http://localhost:5001/api/startup', { headers: { 'x-auth-token': token }});
                const data = await res.json();
                setTasks(data.tasks || []);
            } catch (err) {}
        };
        fetchDashboardData();
    }, []);

    const handleLinkTask = async (taskId) => {
        if (!taskId) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`http://localhost:5001/api/startup/tasks/${taskId}/docs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ docId: selectedDoc._id, title: selectedDoc.title })
            });
            toast.success('Document pinned to task!');
            
            // Re-fetch to update local states
            const dashboardRes = await fetch('http://localhost:5001/api/startup', { headers: { 'x-auth-token': token }});
            setTasks((await dashboardRes.json()).tasks);
        } catch (err) {
            toast.error('Failed to link document');
        }
    };

    const getLinkedTasksForSelectedDoc = () => {
        if (!selectedDoc) return [];
        return tasks.filter(t => t.linkedDocs?.some(d => d._id === selectedDoc._id));
    };

    const linkedTasks = getLinkedTasksForSelectedDoc();

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Synching knowledge engine...</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', height: 'calc(100vh - 160px)' }}>
            {/* Sidebar / List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid var(--border)', paddingRight: '1.5rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Book size={20} color="var(--accent)" /> Wiki
                    </h3>
                    <button onClick={handleCreateNew} className="btn-icon" style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Plus size={18} />
                    </button>
                </div>

                <div className="search-box" style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search docs..." 
                        style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.5rem 0.5rem 2rem', fontSize: '0.85rem' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredDocs.map(doc => (
                        <div 
                            key={doc._id} 
                            onClick={() => { setSelectedDoc(doc); setIsEditing(false); }}
                            style={{ 
                                padding: '0.75rem', 
                                borderRadius: '8px', 
                                cursor: 'pointer', 
                                background: selectedDoc?._id === doc._id ? 'var(--card-bg)' : 'transparent',
                                border: selectedDoc?._id === doc._id ? '1px solid var(--accent)' : '1px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{doc.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{doc.category}</span>
                                <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content / Editor */}
            <div style={{ overflowY: 'auto', paddingRight: '1rem' }}>
                {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input 
                                type="text" 
                                value={editTitle} 
                                onChange={e => setEditTitle(e.target.value)} 
                                placeholder="Document Title" 
                                style={{ fontSize: '2rem', fontWeight: 800, background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setIsEditing(false)} className="btn" style={{ background: 'none', border: '1px solid var(--border)' }}>Cancel</button>
                                <button onClick={handleSave} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Save size={16} /> Save
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <select 
                                value={editCategory} 
                                onChange={e => setEditCategory(e.target.value)}
                                style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
                            >
                                <option value="General">General</option>
                                <option value="SOP">SOP</option>
                                <option value="Meeting Note">Meeting Note</option>
                                <option value="Product Doc">Product Doc</option>
                            </select>
                        </div>

                        <textarea 
                            value={editContent} 
                            onChange={e => setEditContent(e.target.value)} 
                            placeholder="Start writing your startup's core knowledge..." 
                            style={{ width: '100%', minHeight: '400px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', color: 'var(--text-main)', fontSize: '1rem', lineHeight: 1.6, resize: 'vertical' }}
                        />
                    </div>
                ) : selectedDoc ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>{selectedDoc.title}</h1>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FileText size={16} /> {selectedDoc.category}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={16} /> Updated {new Date(selectedDoc.updatedAt).toLocaleDateString()}</span>
                                    <span>By {selectedDoc.author?.name || 'Founder'}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => { 
                                    setEditTitle(selectedDoc.title); 
                                    setEditContent(selectedDoc.content); 
                                    setEditCategory(selectedDoc.category); 
                                    setIsEditing(true); 
                                }} className="btn" style={{ background: 'var(--bg-app)', border: '1px solid var(--border)' }}>Edit</button>
                                <button onClick={() => handleDelete(selectedDoc._id)} className="btn" style={{ color: 'var(--danger)', background: 'none', border: '1px solid var(--danger)' }}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-main)', minHeight: '300px' }}>
                            {selectedDoc.content || <em style={{ color: 'var(--text-muted)' }}>No content in this document yet. Click edit to add some.</em>}
                        </div>

                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LinkIcon size={18} /> execution context
                            </h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Link new task component */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <select 
                                        className="form-input" 
                                        style={{ maxWidth: '300px', fontSize: '0.85rem', padding: '0.5rem' }}
                                        onChange={(e) => { handleLinkTask(e.target.value); e.target.value = ''; }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>+ Pin document to an active Task</option>
                                        {tasks.filter(t => t.status !== 'completed').map(t => (
                                            <option key={t._id} value={t._id}>{t.title} ({t.status})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* List active links */}
                                {linkedTasks.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {linkedTasks.map(t => (
                                            <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.status === 'completed' ? 'var(--success)' : 'var(--accent)' }}></span>
                                                {t.title}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Book size={64} opacity={0.1} />
                        <h2 style={{ marginTop: '1.5rem' }}>Your knowledge base is ready.</h2>
                        <p>Select a document or create a new SOP to get started.</p>
                        <button onClick={handleCreateNew} className="btn-primary" style={{ marginTop: '1rem' }}>Create First Document</button>
                    </div>
                )}
            </div>
        </div>
    );
}
