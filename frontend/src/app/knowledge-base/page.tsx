"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Plus, Database, Search, Upload, Globe, Github, X, FileText, Settings, AlertCircle, ChevronDown, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
interface KBDoc {
    kb_id: string;
    kb_name: string;
    source_type: string;
    chunks_count: number;
    status: string;
    created_at: string;
    error?: string;
    progress?: number;
    progress_message?: string;
    total_chars?: number;
    source_pages?: number;
}

export default function KnowledgeBasePage() {
    const router = useRouter();
    const [kbs, setKbs] = useState<KBDoc[]>([]);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [kbName, setKbName] = useState('');
    const [sourceType, setSourceType] = useState('pdf');
    const [sourceUrl, setSourceUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { user, isLoading } = useAuth();

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const kbsRef = useRef<KBDoc[]>([]);

    const fetchKBs = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/knowledge_base/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const list = data.knowledge_bases || [];
            setKbs(list);
            kbsRef.current = list;
        } catch { }
    };

    useEffect(() => {
        if (!isLoading && !user) { router.push('/'); return; }
        if (!token) return;

        fetchKBs();

        // Poll every 2 seconds when something is processing for snappy progress updates
        const interval = setInterval(() => {
            const hasProcessing = kbsRef.current.some(
                kb => kb.status === 'pending' || kb.status === 'processing'
            );
            if (hasProcessing) fetchKBs();
        }, 2000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, user, isLoading]);

    if (isLoading || !user) return null;

    const deleteKB = async (kbId: string) => {
        toast(
            (t) => (
                <span className="flex items-center gap-3">
                    Delete this knowledge base?
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await fetch(`http://localhost:5000/api/knowledge_base/${kbId}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                fetchKBs();
                                toast.success('Knowledge base deleted');
                            } catch {
                                toast.error('Failed to delete knowledge base');
                            }
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-xs font-bold"
                    >Delete</button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-white/10 text-white text-xs">Cancel</button>
                </span>
            ),
            { duration: 6000 }
        );
    };

    const createKB = async () => {
        if (!kbName.trim()) return;
        if (sourceType === 'pdf' && !file) return;
        if (sourceType !== 'pdf' && !sourceUrl.trim()) return;

        setLoading(true);
        const tid = toast.loading('Ingesting knowledge base...');
        try {
            let options: RequestInit = {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            };

            if (sourceType === 'pdf' && file) {
                const formData = new FormData();
                formData.append('kb_name', kbName);
                formData.append('source_type', sourceType);
                formData.append('file', file);
                options.body = formData;
            } else {
                options.headers = { ...options.headers, 'Content-Type': 'application/json' };
                options.body = JSON.stringify({ kb_name: kbName, source_type: sourceType, source_url: sourceUrl });
            }

            const res = await fetch('http://localhost:5000/api/knowledge_base/', options);
            toast.dismiss(tid);
            if (res.ok) {
                toast.success(`"${kbName}" is being processed. This may take a moment.`);
            } else {
                const errData = await res.json();
                toast.error(errData.error || 'Failed to create knowledge base');
            }
            setShowCreate(false);
            setKbName('');
            setSourceUrl('');
            setFile(null);
            fetchKBs();
        } catch {
            toast.dismiss(tid);
            toast.error('Network error. Please try again.');
        }
        setLoading(false);
    };

    const filteredKBs = kbs.filter(k => k.kb_name.toLowerCase().includes(search.toLowerCase()));

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5 text-orange-400" />;
            case 'website': return <Globe className="w-5 h-5 text-blue-400" />;
            case 'github': return <Github className="w-5 h-5 text-green-400" />;
            default: return <Database className="w-5 h-5 text-retro-muted" />;
        }
    };

    return (
        <div className="min-h-screen text-retro-white">
            <Navbar />

            {/* Dark backdrop overlay */}
            <div className="fixed inset-0 z-0 bg-[#2F3947]/60 backdrop-blur-[2px] pointer-events-none" />

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl font-pixel text-retro-white"
                            >
                                Knowledge Bases
                            </motion.h1>
                            <div className="px-2 py-0.5 bg-retro-panel border-3 border-retro-border text-[10px] uppercase font-bold tracking-widest text-retro-muted">Beta</div>
                        </div>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-retro-muted"
                        >
                            Train your AI models on custom datasets and live data sources.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4"
                    >
                        <div className="relative group">
                            <Search className="w-4 h-4 text-retro-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search datasets..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-11 pr-4 py-2.5 w-64 bg-retro-panel border-3 border-retro-border text-sm text-retro-white focus:outline-none focus:border-retro-border transition-none font-mono"
                            />
                        </div>
                        <Button onClick={() => setShowCreate(true)} className=" h-12 px-6">
                            <Plus className="w-4 h-4 mr-2" /> Connect Data
                        </Button>
                    </motion.div>
                </div>

                {filteredKBs.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-3 border-retro-border bg-retro-panel p-24 text-center border-dashed"
                    >
                        <div className="w-20 h-20 bg-retro-card border-3 border-retro-border flex items-center justify-center mx-auto mb-6">
                            <Database className="w-10 h-10 text-retro-muted" />
                        </div>
                        <h2 className="text-2xl font-pixel mb-3 text-retro-white">No knowledge bases yet</h2>
                        <p className="text-retro-muted mb-10 max-w-sm mx-auto font-sans leading-relaxed">
                            Upload PDFs, crawl websites, or ingest GitHub repositories to give your AI context.
                        </p>
                        <Button onClick={() => setShowCreate(true)} variant="outline" className=" h-12 px-8">
                            Initialize Store <Plus className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredKBs.map((kb, i) => {
                            const isProcessing = kb.status === 'processing' || kb.status === 'pending';
                            const progress = kb.progress ?? (kb.status === 'pending' ? 0 : kb.status === 'completed' ? 100 : 0);
                            return (
                                <motion.div
                                    key={kb.kb_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card className="group hover:border-retro-border transition-all duration-300 relative overflow-hidden">
                                        <CardContent className="p-6">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={cn(
                                                    "w-12 h-12  flex items-center justify-center border",
                                                    kb.source_type === 'pdf' ? "bg-orange-500/10 border-orange-500/20" :
                                                        kb.source_type === 'website' ? "bg-blue-500/10 border-blue-500/20" :
                                                            "bg-green-500/10 border-green-500/20"
                                                )}>
                                                    {getIcon(kb.source_type)}
                                                </div>
                                                <div className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                                    kb.status === 'completed' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                                        kb.status === 'failed' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                                            "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                                )}>
                                                    {kb.status === 'pending' ? 'Queued' : kb.status}
                                                </div>
                                            </div>

                                            {/* Name */}
                                            <h3 className="text-xl font-medium mb-3 text-retro-white group-hover:text-retro-cyan transition-none">{kb.kb_name}</h3>

                                            {/* Progress bar — shown while processing */}
                                            {isProcessing && (
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[10px] text-retro-muted font-mono">
                                                            {kb.progress_message || 'Initializing...'}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-amber-400 tabular-nums">{progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-retro-panel overflow-hidden">
                                                        <motion.div
                                                            className="h-full "
                                                            style={{
                                                                background: 'linear-gradient(90deg, #f59e0b, #fcd34d)',
                                                            }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Stats — shown when completed */}
                                            {!isProcessing && kb.status === 'completed' && (
                                                <div className="flex gap-4 mb-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-retro-muted uppercase font-bold tracking-widest">Type</span>
                                                        <span className="text-sm font-medium text-retro-muted">{kb.source_type.toUpperCase()}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-retro-muted uppercase font-bold tracking-widest">Chunks</span>
                                                        <span className="text-sm font-medium text-retro-muted">{kb.chunks_count.toLocaleString()}</span>
                                                    </div>
                                                    {kb.total_chars && (
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-retro-muted uppercase font-bold tracking-widest">Chars</span>
                                                            <span className="text-sm font-medium text-retro-muted">{(kb.total_chars / 1000).toFixed(0)}k</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Error message */}
                                            {kb.status === 'failed' && kb.error && (
                                                <div className="p-3 bg-red-500/5 border border-red-500/10 flex items-start gap-2 mb-3">
                                                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] text-red-400/80 leading-relaxed italic">{kb.error}</p>
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-retro-border">
                                                <span className="text-[10px] text-retro-dim font-mono italic">ID: {kb.kb_id.slice(0, 8)}...</span>
                                                <div className="flex items-center gap-2">
                                                    <Button onClick={() => deleteKB(kb.kb_id)} variant="ghost" size="sm" className=" h-8 px-2 text-retro-muted hover:text-red-400">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className=" h-8 px-2 text-retro-muted hover:text-retro-white">
                                                        <Settings className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] px-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="absolute inset-0 bg-[#2F3947]/80 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-retro-panel border-3 border-retro-border overflow-hidden shadow-pixel"
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-pixel text-retro-white">Connect Data</h3>
                                        <p className="text-retro-muted text-sm mt-1">Ground your AI in your reality.</p>
                                    </div>
                                    <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-retro-panel transition-colors">
                                        <X className="w-5 h-5 text-retro-muted" />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-retro-muted uppercase tracking-widest ml-1">Database Name</label>
                                        <input
                                            type="text"
                                            value={kbName}
                                            onChange={(e) => setKbName(e.target.value)}
                                            placeholder="e.g. Project Archive"
                                            className="w-full bg-retro-card border-3 border-retro-border px-5 py-3.5 text-retro-white placeholder:text-retro-muted focus:outline-none focus:border-retro-cyan/50 transition-none font-mono"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-retro-muted uppercase tracking-widest ml-1">Source Pipeline</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { val: 'pdf', lbl: 'PDF', ic: <Upload className="w-4 h-4" /> },
                                                { val: 'website', lbl: 'Spider', ic: <Globe className="w-4 h-4" /> },
                                                { val: 'github', lbl: 'Git', ic: <Github className="w-4 h-4" /> },
                                            ].map(s => (
                                                <button
                                                    key={s.val}
                                                    onClick={() => setSourceType(s.val)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center gap-2 p-4  border transition-all duration-300",
                                                        sourceType === s.val ? "bg-retro-panel border-retro-cyan text-retro-cyan" : "bg-retro-panel border-retro-border text-retro-white hover:bg-retro-card"
                                                    )}
                                                >
                                                    {s.ic}
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{s.lbl}</span>
                                                    {sourceType === s.val && <motion.div layoutId="srcCheck" className="absolute top-2 right-2"><Check className="w-3 h-3" /></motion.div>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {sourceType !== 'pdf' && (
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-retro-muted uppercase tracking-widest ml-1">{sourceType === 'website' ? 'Target URL' : 'Repository URL'}</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={sourceUrl}
                                                    onChange={(e) => setSourceUrl(e.target.value)}
                                                    placeholder={sourceType === 'website' ? 'https://docs.myproduct.com' : 'https://github.com/org/repo'}
                                                    className="w-full bg-retro-card border-3 border-retro-border px-5 py-3.5 text-retro-white placeholder:text-retro-muted focus:outline-none focus:border-retro-cyan/50 transition-none font-mono text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {sourceType === 'pdf' && (
                                        <div className="relative">
                                            <div className="border-3 border-dashed border-retro-border p-10 text-center hover:bg-retro-card transition-none cursor-pointer group">
                                                <Upload className="w-8 h-8 text-retro-dim mx-auto mb-4 group-hover:text-retro-cyan transition-colors" />
                                                <p className="text-sm text-retro-muted font-medium mb-1 truncate px-4">{file ? file.name : 'Drop architectural PDF here'}</p>
                                                <p className="text-[10px] text-retro-dim uppercase tracking-widest">Supports up to 50MB</p>
                                                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                    )}

                                    <Button onClick={createKB} disabled={loading || !kbName.trim()} className="w-full h-14 bg-retro-cyan text-retro-ink hover:bg-retro-cyan/80 mt-4 shadow-pixel font-pixel transition-none">
                                        {loading ? 'Ingesting Pipeline...' : 'Initialize Ingestion'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
