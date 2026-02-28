"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Plus, AppWindow, Trash2, Copy, Check, X, Search, Code, Cpu, Activity, Clock, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ModelDoc {
    id: string;
    name: string;
    provider: 'openrouter' | 'groq';
    context_length: number;
    free: boolean;
}

interface AppDoc {
    app_id: string;
    app_name: string;
    model_name: string;
    knowledge_base_ids: string[];
    created_at: string;
    status?: string;
    last_active?: string;
}

export default function ApplicationsPage() {
    const router = useRouter();
    const [apps, setApps] = useState<AppDoc[]>([]);
    const [models, setModels] = useState<ModelDoc[]>([]);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newAppName, setNewAppName] = useState('');
    const [newModel, setNewModel] = useState('llama-3.1-8b-instant');
    const [loading, setLoading] = useState(false);
    const [createdKey, setCreatedKey] = useState('');
    const [copiedKey, setCopiedKey] = useState(false);
    const [selectedSdkApp, setSelectedSdkApp] = useState<AppDoc | null>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const fetchApps = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/applications/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setApps(data.applications || []);
        } catch { }
    };

    useEffect(() => {
        if (!token) { router.push('/login'); return; }
        fetchApps();
        // Fetch live models
        fetch('http://localhost:5000/api/models/', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(d => {
            const list: ModelDoc[] = d.models || [];
            setModels(list);
            if (list.length > 0 && !list.find(m => m.id === newModel)) {
                setNewModel(list[0].id);
            }
        }).catch(() => { });
    }, []);

    const createApp = async () => {
        if (!newAppName.trim()) return;
        setLoading(true);
        const loadingToast = toast.loading('Initializing application...');
        try {
            const res = await fetch('http://localhost:5000/api/applications/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ app_name: newAppName, model_name: newModel })
            });
            const data = await res.json();
            toast.dismiss(loadingToast);
            if (data.api_key) {
                setCreatedKey(data.api_key);
                toast.success('Application initialized! Save your API key.');
            } else {
                toast.error(data.error || 'Failed to create application');
            }
            setNewAppName('');
            fetchApps();
        } catch {
            toast.dismiss(loadingToast);
            toast.error('Network error. Please try again.');
        }
        setLoading(false);
    };

    const deleteApp = async (appId: string) => {
        toast(
            (t) => (
                <span className="flex items-center gap-3">
                    Delete this application?
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await fetch(`http://localhost:5000/api/applications/${appId}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                fetchApps();
                                toast.success('Application deleted');
                            } catch {
                                toast.error('Failed to delete application');
                            }
                        }}
                        className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-bold"
                    >Delete</button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs">Cancel</button>
                </span>
            ),
            { duration: 6000 }
        );
    };

    const filteredApps = apps.filter(a => a.app_name.toLowerCase().includes(search.toLowerCase()));

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch { return dateStr; }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 bg-organic-grid opacity-20 pointer-events-none" />
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-gold-base/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[40vw] h-[40vw] bg-gold-dark/5 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-serif font-medium mb-2"
                        >
                            Applications
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-zinc-500"
                        >
                            Manage your AI models and API integrations.
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
                                placeholder="Search apps..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-11 pr-4 py-2.5 w-64 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:border-white/20 transition-all font-sans"
                            />
                        </div>
                        <Button onClick={() => { setShowCreate(true); setCreatedKey(''); }} className="rounded-full h-12 px-6">
                            <Plus className="w-4 h-4 mr-2" /> Create App
                        </Button>
                    </motion.div>
                </div>

                {filteredApps.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-20 text-center"
                    >
                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                            <AppWindow className="w-10 h-10 text-zinc-500" />
                        </div>
                        <h2 className="text-2xl font-serif font-medium mb-2">No applications yet</h2>
                        <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Create your first application to start building with Mindflare.</p>
                        <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-full">
                            Get Started <Plus className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredApps.map((app, i) => (
                            <motion.div
                                key={app.app_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="group hover:border-white/20 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                                    {app.status === 'active' && (
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                                            </div>
                                        </div>
                                    )}
                                    <CardHeader className="pb-4">
                                        <div className="w-12 h-12 rounded-xl bg-gold-base/10 border border-gold-base/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                                            <Cpu className="w-6 h-6 text-gold-base" />
                                        </div>
                                        <CardTitle className="text-xl">{app.app_name}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <Activity className="w-3.5 h-3.5" />
                                            {app.model_name.split('/').pop()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className={cn(
                                                "p-3 rounded-xl border",
                                                (app.knowledge_base_ids?.length || 0) === 0
                                                    ? "bg-amber-500/5 border-amber-500/20"
                                                    : "bg-white/5 border-white/5"
                                            )}>
                                                <p className={cn("text-[10px] uppercase font-bold tracking-wider mb-1", (app.knowledge_base_ids?.length || 0) === 0 ? "text-amber-500/60" : "text-zinc-500")}>Knowledge</p>
                                                <p className={cn("text-sm font-medium", (app.knowledge_base_ids?.length || 0) === 0 ? "text-amber-400" : "")}>
                                                    {(app.knowledge_base_ids?.length || 0) === 0 ? "⚠ None" : `${app.knowledge_base_ids.length} Bases`}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Created</p>
                                                <p className="text-sm font-medium">{formatDate(app.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="h-px bg-white/5" />
                                        <div className="flex items-center justify-between">
                                            <Link href={`/applications/${app.app_id}`}>
                                                <Button variant="ghost" size="sm" className="rounded-full text-xs font-medium text-gold-light hover:text-gold-base hover:bg-gold-base/10">
                                                    <Code className="w-3.5 h-3.5 mr-2" /> Configure & Chat
                                                </Button>
                                            </Link>
                                            <div className="flex gap-1">
                                                <Button onClick={() => setSelectedSdkApp(app)} variant="ghost" size="sm" className="rounded-full text-zinc-500 hover:text-white">
                                                    <Code className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button onClick={() => deleteApp(app.app_id)} variant="ghost" size="sm" className="rounded-full text-red-400/70 hover:text-red-400 hover:bg-red-400/10">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreate(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-serif font-medium">{createdKey ? 'App Initialized' : 'New Application'}</h3>
                                        <p className="text-zinc-500 text-sm mt-1">{createdKey ? 'Your API key is ready.' : 'Set up your AI environment.'}</p>
                                    </div>
                                    {!loading && (
                                        <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                            <X className="w-5 h-5 text-zinc-500" />
                                        </button>
                                    )}
                                </div>

                                {!createdKey ? (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">App Name</label>
                                            <input
                                                type="text"
                                                value={newAppName}
                                                onChange={(e) => setNewAppName(e.target.value)}
                                                placeholder="e.g. Sales Assistant"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:outline-none focus:border-gold-base/50 transition-all font-sans"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">LLM Model</label>
                                            <div className="relative">
                                                <select
                                                    value={newModel}
                                                    onChange={(e) => setNewModel(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:outline-none appearance-none font-sans text-sm"
                                                >
                                                    {models.length === 0 ? (
                                                        <option value="llama-3.1-8b-instant" className="bg-zinc-950">⚡ Groq: Llama 3.1 8B (default)</option>
                                                    ) : (
                                                        <>
                                                            <optgroup label="⚡ Groq — Ultra Fast">
                                                                {models.filter((m: ModelDoc) => m.provider === 'groq').map((m: ModelDoc) => (
                                                                    <option key={m.id} value={m.id} className="bg-zinc-950">{m.name}</option>
                                                                ))}
                                                            </optgroup>
                                                            <optgroup label="🔮 OpenRouter — Free">
                                                                {models.filter((m: ModelDoc) => m.provider === 'openrouter').map((m: ModelDoc) => (
                                                                    <option key={m.id} value={m.id} className="bg-zinc-950">{m.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        </>
                                                    )}
                                                </select>
                                                <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        </div>
                                        <Button onClick={createApp} disabled={loading || !newAppName.trim()} className="w-full h-14 rounded-2xl bg-gold-base text-black hover:bg-gold-light mt-4 shadow-lg shadow-gold-base/20 transition-all">
                                            {loading ? 'Initializing Engine...' : 'Initialize Application'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/10">
                                            <p className="text-xs text-green-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Shield className="w-3.5 h-3.5" /> Secret API Key
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <code className="flex-1 text-xs bg-black/40 px-4 py-3 rounded-xl border border-white/5 text-zinc-300 font-mono break-all">
                                                    {createdKey}
                                                </code>
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(createdKey); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }}
                                                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                                                >
                                                    {copiedKey ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="mt-4 text-[10px] text-zinc-500 font-medium leading-relaxed italic">
                                                Warning: This key grants full access to your application. Secure it immediately; it cannot be shown again.
                                            </p>
                                        </div>
                                        <Button onClick={() => setShowCreate(false)} variant="outline" className="w-full h-14 rounded-2xl">
                                            Complete Setup
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SDK Snippet Modal */}
            <AnimatePresence>
                {selectedSdkApp && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] px-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSdkApp(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-serif font-medium">Integration Guide</h3>
                                        <p className="text-zinc-500 text-sm mt-1">Connect {selectedSdkApp.app_name} to your stack.</p>
                                    </div>
                                    <button onClick={() => setSelectedSdkApp(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-zinc-500" />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-gold-light">
                                            <div className="w-6 h-6 rounded-full bg-gold-base/10 flex items-center justify-center text-[10px] font-bold">1</div>
                                            <p className="text-sm font-semibold">Install the SDK</p>
                                        </div>
                                        <div className="relative group">
                                            <pre className="bg-black/60 p-4 rounded-2xl border border-white/10 text-xs text-zinc-300 font-mono">
                                                npm install mindflare-sdk
                                            </pre>
                                            <button onClick={() => navigator.clipboard.writeText('npm install mindflare-sdk')} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg">
                                                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-gold-light">
                                            <div className="w-6 h-6 rounded-full bg-gold-base/10 flex items-center justify-center text-[10px] font-bold">2</div>
                                            <p className="text-sm font-semibold">Start Chatting</p>
                                        </div>
                                        <div className="relative group">
                                            <pre className="bg-black/60 p-5 rounded-2xl border border-white/10 text-xs text-zinc-400 font-mono overflow-x-auto leading-6">
                                                <span className="text-gold-dark/70">{"import Mindflare from 'mindflare-sdk';"}</span><br />
                                                <br />
                                                <span className="text-zinc-500">{"const mf = new Mindflare('YOUR_API_KEY');"}</span><br />
                                                <span className="text-zinc-500">{"const res = await mf.chat('Hello!');"}</span>
                                            </pre>
                                            <button className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg">
                                                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-gold-base/5 border border-gold-base/10 flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gold-base/10 flex items-center justify-center shrink-0">
                                            <Activity className="w-5 h-5 text-gold-base" />
                                        </div>
                                        <p className="text-xs text-gold-light/80 leading-relaxed font-sans">
                                            Mindflare tracks real-time usage. Once your SDK makes its first call, this application&apos;s status will update to <span className="font-bold text-green-500">Live</span> automatically.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
