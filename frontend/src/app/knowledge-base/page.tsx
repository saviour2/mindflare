"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Plus, Database, Search, Upload, Globe, Github, X, FileText, Settings, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KBDoc {
    kb_id: string;
    kb_name: string;
    source_type: string;
    chunks_count: number;
    status: string;
    created_at: string;
    error?: string;
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

        const interval = setInterval(() => {
            const hasProcessing = kbs.some(kb => kb.status === 'pending' || kb.status === 'processing');
            if (hasProcessing || kbs.length === 0) {
                fetchKBs();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [token, kbs]);

    const createKB = async () => {
        if (!kbName.trim()) return;
        if (sourceType === 'pdf' && !file) return;
        if (sourceType !== 'pdf' && !sourceUrl.trim()) return;

        setLoading(true);
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

            await fetch('http://localhost:5000/api/knowledge_base/', options);
            setShowCreate(false);
            setKbName('');
            setSourceUrl('');
            setFile(null);
            fetchKBs();
        } catch { }
        setLoading(false);
    };

    const filteredKBs = kbs.filter(k => k.kb_name.toLowerCase().includes(search.toLowerCase()));

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5 text-orange-400" />;
            case 'website': return <Globe className="w-5 h-5 text-blue-400" />;
            case 'github': return <Github className="w-5 h-5 text-green-400" />;
            default: return <Database className="w-5 h-5 text-zinc-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 bg-organic-grid opacity-20 pointer-events-none" />
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[30%] left-[-10%] w-[50vw] h-[50vw] bg-accent-cyan/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] bg-gold-base/5 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl font-serif font-medium"
                            >
                                Knowledge Bases
                            </motion.h1>
                            <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-widest text-zinc-500">Beta</div>
                        </div>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-zinc-500"
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
                            <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search datasets..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-11 pr-4 py-2.5 w-64 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:border-white/20 transition-all"
                            />
                        </div>
                        <Button onClick={() => setShowCreate(true)} className="rounded-full h-12 px-6">
                            <Plus className="w-4 h-4 mr-2" /> Connect Data
                        </Button>
                    </motion.div>
                </div>

                {filteredKBs.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl p-24 text-center border-dashed"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                            <Database className="w-10 h-10 text-zinc-500" />
                        </div>
                        <h2 className="text-2xl font-serif font-medium mb-3">No knowledge bases yet</h2>
                        <p className="text-zinc-500 mb-10 max-w-sm mx-auto font-sans leading-relaxed">
                            Upload PDFs, crawl websites, or ingest GitHub repositories to give your AI context.
                        </p>
                        <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-full h-12 px-8">
                            Initialize Store <Plus className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredKBs.map((kb, i) => (
                            <motion.div
                                key={kb.kb_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="group hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center border",
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
                                                        "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
                                            )}>
                                                {kb.status}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-medium mb-2 group-hover:text-gold-light transition-colors">{kb.kb_name}</h3>
                                        <div className="flex gap-4 mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Type</span>
                                                <span className="text-sm font-medium text-zinc-400">{kb.source_type.toUpperCase()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Chunks</span>
                                                <span className="text-sm font-medium text-zinc-400">{kb.chunks_count}</span>
                                            </div>
                                        </div>
                                        {kb.status === 'failed' && kb.error && (
                                            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-2 mb-2">
                                                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-red-400/80 leading-relaxed italic">{kb.error}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                                            <span className="text-[10px] text-zinc-600 font-mono italic">ID: {kb.kb_id.slice(0, 8)}...</span>
                                            <Button variant="ghost" size="sm" className="rounded-lg h-8 px-2 text-zinc-500 hover:text-white">
                                                <Settings className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] px-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-serif font-medium">Connect Data</h3>
                                        <p className="text-zinc-500 text-sm mt-1">Ground your AI in your reality.</p>
                                    </div>
                                    <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-zinc-500" />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Database Name</label>
                                        <input
                                            type="text"
                                            value={kbName}
                                            onChange={(e) => setKbName(e.target.value)}
                                            placeholder="e.g. Project Archive"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-gold-base/50 transition-all font-sans"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Source Pipeline</label>
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
                                                        "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300",
                                                        sourceType === s.val ? "bg-gold-base/10 border-gold-base/40 text-gold-light" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/[0.07]"
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
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">{sourceType === 'website' ? 'Target URL' : 'Repository URL'}</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={sourceUrl}
                                                    onChange={(e) => setSourceUrl(e.target.value)}
                                                    placeholder={sourceType === 'website' ? 'https://docs.myproduct.com' : 'https://github.com/org/repo'}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-gold-base/50 transition-all font-sans text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {sourceType === 'pdf' && (
                                        <div className="relative">
                                            <div className="border-2 border-dashed border-white/10 rounded-[1.5rem] p-10 text-center hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                                <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-4 group-hover:text-gold-light transition-colors" />
                                                <p className="text-sm text-zinc-400 font-medium mb-1 truncate px-4">{file ? file.name : 'Drop architectural PDF here'}</p>
                                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Supports up to 50MB</p>
                                                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                    )}

                                    <Button onClick={createKB} disabled={loading || !kbName.trim()} className="w-full h-14 rounded-2xl bg-gold-base text-black hover:bg-gold-light mt-4 shadow-lg shadow-gold-base/20 transition-all">
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
