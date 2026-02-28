"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Plus, Database, Search, Upload, Globe, Github, X } from 'lucide-react';

interface KBDoc {
    kb_id: string;
    kb_name: string;
    source_type: string;
    chunks_count: number;
    status: string;
    created_at: string;
}

export default function KnowledgeBasePage() {
    const router = useRouter();
    const [kbs, setKbs] = useState<KBDoc[]>([]);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [kbName, setKbName] = useState('');
    const [sourceType, setSourceType] = useState('pdf');
    const [sourceUrl, setSourceUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const fetchKBs = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/knowledge_base/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setKbs(data.knowledge_bases || []);
        } catch { }
    };

    useEffect(() => {
        if (!token) { router.push('/login'); return; }
        fetchKBs();
    }, []);

    const createKB = async () => {
        if (!kbName.trim()) return;
        setLoading(true);
        try {
            await fetch('http://localhost:5000/api/knowledge_base/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ kb_name: kbName, source_type: sourceType, source_url: sourceUrl })
            });
            setShowCreate(false);
            setKbName('');
            setSourceUrl('');
            fetchKBs();
        } catch { }
        setLoading(false);
    };

    const filteredKBs = kbs.filter(k => k.kb_name.toLowerCase().includes(search.toLowerCase()));
    const typeIcon = (t: string) => t === 'pdf' ? <Upload className="w-5 h-5 text-orange-400" /> : t === 'website' ? <Globe className="w-5 h-5 text-blue-400" /> : <Github className="w-5 h-5 text-green-400" />;
    const statusBadge = (s: string) => s === 'completed' ? 'bg-green-500/10 text-green-400' : s === 'processing' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400';

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Navbar />
            <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold">Knowledge Bases <span className="text-sm font-normal text-[var(--text-muted)] px-2 py-0.5 rounded border border-[var(--border-color)]">Beta</span></h1>
                        <p className="text-[var(--text-secondary)] text-sm mt-1">Manage your knowledge bases for RAG.</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Create KB
                    </button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4 my-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search knowledge bases..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <select className="px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] focus:outline-none">
                        <option>Newest First</option>
                        <option>Oldest First</option>
                    </select>
                </div>

                {/* Create Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 animate-slide-down">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Create Knowledge Base</h3>
                                <button onClick={() => setShowCreate(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Name</label>
                                    <input type="text" value={kbName} onChange={(e) => setKbName(e.target.value)} placeholder="My Knowledge Base"
                                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">Source Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { val: 'pdf', lbl: 'PDF', ic: <Upload className="w-4 h-4" /> },
                                            { val: 'website', lbl: 'Website', ic: <Globe className="w-4 h-4" /> },
                                            { val: 'github', lbl: 'GitHub', ic: <Github className="w-4 h-4" /> },
                                        ].map(s => (
                                            <button key={s.val} onClick={() => setSourceType(s.val)}
                                                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${sourceType === s.val ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}>
                                                {s.ic} {s.lbl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {sourceType !== 'pdf' && (
                                    <div>
                                        <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">{sourceType === 'website' ? 'Website URL' : 'GitHub Repo URL'}</label>
                                        <input type="text" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder={sourceType === 'website' ? 'https://example.com' : 'https://github.com/user/repo'}
                                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 text-sm" />
                                    </div>
                                )}
                                {sourceType === 'pdf' && (
                                    <div className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer">
                                        <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                                        <p className="text-sm text-[var(--text-muted)]">Click or drag PDF file here</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">Max 10MB</p>
                                    </div>
                                )}
                                <button onClick={createKB} disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 disabled:opacity-50 text-sm">
                                    {loading ? 'Creating...' : 'Create Knowledge Base'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* KB List */}
                {filteredKBs.length === 0 ? (
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-16 text-center animate-fade-in">
                        <Database className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                        <p className="text-lg font-semibold mb-1">No knowledge bases yet</p>
                        <p className="text-sm text-[var(--text-muted)]">Upload PDFs, crawl websites, or ingest GitHub repos.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredKBs.map((kb, i) => (
                            <div key={kb.kb_id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 flex items-center justify-between hover:border-[var(--border-light)] transition-colors animate-fade-in" style={{ animationDelay: `${0.05 * i}s` }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center">
                                        {typeIcon(kb.source_type)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{kb.kb_name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{kb.source_type.toUpperCase()} · {kb.chunks_count} chunks</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(kb.status)}`}>
                                    {kb.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
