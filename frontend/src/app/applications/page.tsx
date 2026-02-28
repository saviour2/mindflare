"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Plus, AppWindow, Trash2, Copy, Check, X, Search, Code, Cpu, Activity, Clock, ChevronDown, Shield, Github, GitPullRequest, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

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
    const searchParams = useSearchParams();
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

    // GitHub / Auto-PR state
    const [ghConnected, setGhConnected] = useState(false);
    const [ghLogin, setGhLogin] = useState('');
    const [ghRepos, setGhRepos] = useState<any[]>([]);
    const [ghLoading, setGhLoading] = useState(false);
    const [showAutoPR, setShowAutoPR] = useState<AppDoc | null>(null);
    const [selectedRepo, setSelectedRepo] = useState('');
    const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
    const [prLoading, setPrLoading] = useState(false);
    const [prResult, setPrResult] = useState<{ url: string, stack: string } | null>(null);

    const { user, isLoading } = useAuth();

    // Since our backend might still rely on tokens for now, let's keep it checking 'token' from localStorage 
    // but protect the page with `useAuth`.
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
        if (!isLoading && !user) { router.push('/'); return; }
        if (!token) return;

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

        // Check GitHub connection status
        fetch('http://localhost:5000/api/github/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(d => {
            setGhConnected(d.connected);
            setGhLogin(d.github_login || '');
            if (d.connected) fetchGhRepos();
        }).catch(() => { });

        // Handle GitHub OAuth callback toast
        const ghStatus = searchParams.get('gh');
        const ghLoginParam = searchParams.get('login');
        if (ghStatus === 'connected') toast.success(`GitHub connected as @${ghLoginParam}!`);
        if (ghStatus === 'error') toast.error('GitHub connection failed. Try again.');
    }, [user, isLoading, router, token]);

    if (isLoading || !user) return null;

    const fetchGhRepos = async () => {
        const tk = localStorage.getItem('token');
        if (!tk) return;
        try {
            const res = await fetch('http://localhost:5000/api/github/repos', {
                headers: { 'Authorization': `Bearer ${tk}` }
            });
            const d = await res.json();
            setGhRepos(d.repos || []);
        } catch { }
    };

    const connectGitHub = async () => {
        setGhLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/github/auth', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await res.json();
            if (d.url) window.location.href = d.url;
            else toast.error('Failed to initiate GitHub OAuth');
        } catch { toast.error('Failed to connect GitHub'); }
        setGhLoading(false);
    };

    const fireAutoPR = async () => {
        if (!selectedRepo || !showAutoPR) return;
        const repo = ghRepos.find(r => r.full_name === selectedRepo);
        if (!repo) return;

        setPrLoading(true);
        setPrResult(null);
        const loadingT = toast.loading('Generating integration code and opening PR...');
        try {
            const res = await fetch('http://localhost:5000/api/github/auto-pr', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repo_full_name: repo.full_name,
                    default_branch: repo.default_branch,
                    app_id: showAutoPR.app_id,
                    api_key: '(retrieve from settings vault)',
                })
            });
            const d = await res.json();
            toast.dismiss(loadingT);
            if (d.pr_url) {
                setPrResult({ url: d.pr_url, stack: d.stack });
                toast.success('Pull Request created!');
            } else {
                toast.error(d.error || 'Failed to create PR');
            }
        } catch {
            toast.dismiss(loadingT);
            toast.error('Network error');
        }
        setPrLoading(false);
    };

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
                <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-base/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-dark/5 rounded-full blur-[100px]" />
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

                {/* GitHub Integration Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-8 p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border",
                            ghConnected ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-white/10"
                        )}>
                            <Github className={cn("w-5 h-5", ghConnected ? "text-green-400" : "text-zinc-500")} />
                        </div>
                        <div>
                            <p className="text-sm font-medium">
                                {ghConnected ? `GitHub Connected — @${ghLogin}` : "Connect GitHub for Auto-PR"}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                {ghConnected
                                    ? "Click 'Auto PR' on any app to inject the chatbot into your repo via a Pull Request."
                                    : "Authorize Mindflare to generate integration code and open PRs automatically."}
                            </p>
                        </div>
                    </div>
                    {!ghConnected ? (
                        <Button onClick={connectGitHub} disabled={ghLoading} variant="outline" className="rounded-full h-10 px-6 border-white/10 whitespace-nowrap shrink-0">
                            {ghLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Github className="w-4 h-4 mr-2" />}
                            {ghLoading ? "Redirecting…" : "Connect GitHub"}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
                            <Wifi className="w-3 h-3" /> Connected
                        </div>
                    )}
                </motion.div>

                {/* Auto-PR Modal */}
                <AnimatePresence>
                    {showAutoPR && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => { setShowAutoPR(null); setPrResult(null); setSelectedRepo(''); setRepoDropdownOpen(false); }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                            <GitPullRequest className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm">Auto Pull Request</h3>
                                            <p className="text-xs text-zinc-500">{showAutoPR.app_name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setShowAutoPR(null); setPrResult(null); setSelectedRepo(''); setRepoDropdownOpen(false); }} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-5">
                                    {!prResult ? (
                                        <>
                                            <p className="text-sm text-zinc-400 font-sans">
                                                Mindflare detects your stack, generates integration code, and opens a PR automatically.
                                            </p>
                                            <div className="relative">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Select Repository</label>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setRepoDropdownOpen(!repoDropdownOpen); }}
                                                    className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all rounded-xl p-3 text-sm text-zinc-300 font-sans focus:outline-none"
                                                >
                                                    <span className="truncate">
                                                        {selectedRepo
                                                            ? ghRepos.find(r => r.full_name === selectedRepo)?.full_name || selectedRepo
                                                            : '— choose a repo —'
                                                        }
                                                    </span>
                                                    <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", repoDropdownOpen && "rotate-180")} />
                                                </button>

                                                <AnimatePresence>
                                                    {repoDropdownOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                                        >
                                                            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                                                {ghRepos.length === 0 ? (
                                                                    <div className="p-3 text-sm text-zinc-500 text-center font-sans">No repositories found.</div>
                                                                ) : (
                                                                    ghRepos.map(r => (
                                                                        <button
                                                                            key={r.full_name}
                                                                            onClick={() => { setSelectedRepo(r.full_name); setRepoDropdownOpen(false); }}
                                                                            className={cn(
                                                                                "w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-sans transition-colors",
                                                                                selectedRepo === r.full_name ? "bg-purple-500/20 text-purple-300" : "hover:bg-white/5 text-zinc-300"
                                                                            )}
                                                                        >
                                                                            <span className="truncate">{r.full_name}</span>
                                                                            {r.language && <span className="text-[10px] text-zinc-500 font-mono ml-2 shrink-0">{r.language}</span>}
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs text-zinc-400 font-sans">
                                                <p className="font-bold text-zinc-300 text-xs uppercase tracking-widest mb-2">What gets created</p>
                                                <p>✦ New branch: <code className="text-purple-300">mindflare/chatbot-integration</code></p>
                                                <p>✦ Stack auto-detected (Next.js / React / HTML)</p>
                                                <p>✦ Integration files committed with credentials pre-filled</p>
                                                <p>✦ Pull Request opened on <code className="text-purple-300">{selectedRepo || 'your repo'}</code></p>
                                            </div>
                                            <Button
                                                onClick={fireAutoPR}
                                                disabled={!selectedRepo || prLoading}
                                                className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                                            >
                                                {prLoading
                                                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating PR…</>
                                                    : <><GitPullRequest className="w-4 h-4 mr-2" />Generate & Open PR</>
                                                }
                                            </Button>
                                        </>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
                                            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                                                <Check className="w-8 h-8 text-green-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-1">Pull Request Created!</h4>
                                                <p className="text-xs text-zinc-400">Stack: <span className="text-purple-300 font-mono">{prResult.stack}</span></p>
                                            </div>
                                            <a href={prResult.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors">
                                                <Github className="w-4 h-4" /> View Pull Request on GitHub
                                            </a>
                                            <button onClick={() => { setPrResult(null); setSelectedRepo(''); }} className="text-xs text-zinc-500 hover:text-white transition-colors">
                                                Create another PR
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                        <div className="w-12 h-12 rounded-xl bg-blue-base/10 border border-blue-base/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                                            <Cpu className="w-6 h-6 text-blue-base" />
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
                                                <Button variant="ghost" size="sm" className="rounded-full text-xs font-medium text-blue-light hover:text-blue-base hover:bg-blue-base/10">
                                                    <Code className="w-3.5 h-3.5 mr-2" /> Configure & Chat
                                                </Button>
                                            </Link>
                                            <div className="flex gap-1">
                                                {ghConnected && (
                                                    <Button
                                                        onClick={() => { setShowAutoPR(app); setPrResult(null); setSelectedRepo(''); }}
                                                        variant="ghost" size="sm"
                                                        className="rounded-full text-purple-400/70 hover:text-purple-400 hover:bg-purple-400/10"
                                                        title="Auto-PR: Inject chatbot into GitHub repo"
                                                    >
                                                        <GitPullRequest className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
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
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:outline-none focus:border-blue-base/50 transition-all font-sans"
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
                                        <Button onClick={createApp} disabled={loading || !newAppName.trim()} className="w-full h-14 rounded-2xl bg-blue-base text-black hover:bg-blue-light mt-4 shadow-lg shadow-blue-base/20 transition-all">
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
                                        <div className="flex items-center gap-2 text-blue-light">
                                            <div className="w-6 h-6 rounded-full bg-blue-base/10 flex items-center justify-center text-[10px] font-bold">1</div>
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
                                        <div className="flex items-center gap-2 text-blue-light">
                                            <div className="w-6 h-6 rounded-full bg-blue-base/10 flex items-center justify-center text-[10px] font-bold">2</div>
                                            <p className="text-sm font-semibold">Start Chatting</p>
                                        </div>
                                        <div className="relative group">
                                            <pre className="bg-black/60 p-5 rounded-2xl border border-white/10 text-xs text-zinc-400 font-mono overflow-x-auto leading-6">
                                                <span className="text-blue-400">{"import { Mindflare } from 'mindflare-sdk';"}</span><br />
                                                <br />
                                                <span className="text-zinc-500">{"const mf = new Mindflare({"}</span><br />
                                                <span className="text-zinc-500">{"  email: 'YOUR_EMAIL',"}</span><br />
                                                <span className="text-zinc-500">{"  password: 'YOUR_PASSWORD',"}</span><br />
                                                <span className="text-zinc-500">{"  clientSecret: '"}<span className="text-emerald-400">{user?.client_secret || 'YOUR_CLIENT_SECRET'}</span>',</span><br />
                                                <span className="text-zinc-500">{"  appId: '"}<span className="text-emerald-400">{selectedSdkApp.app_id}</span>'</span><br />
                                                <span className="text-zinc-500">{"  apiKey: 'YOUR_API_KEY'"}</span><br />
                                                <span className="text-zinc-500">{"});"}</span><br />
                                                <br />
                                                <span className="text-zinc-500">{"const res = await mf.ask('Hello!');"}</span>
                                            </pre>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(`import { Mindflare } from 'mindflare-sdk';\n\nconst mf = new Mindflare({\n  email: 'YOUR_EMAIL',\n  password: 'YOUR_PASSWORD',\n  clientSecret: '${user?.client_secret || 'YOUR_CLIENT_SECRET'}',\n  appId: '${selectedSdkApp.app_id}',\n  apiKey: 'YOUR_API_KEY'\n});\n\nconst res = await mf.ask('Hello!');`)}
                                                className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg"
                                            >
                                                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-blue-base/5 border border-blue-base/10 flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-base/10 flex items-center justify-center shrink-0">
                                            <Activity className="w-5 h-5 text-blue-base" />
                                        </div>
                                        <p className="text-xs text-blue-light/80 leading-relaxed font-sans">
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
