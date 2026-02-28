"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Plus, AppWindow, Trash2, Copy, Check, X, Search } from 'lucide-react';

const MODELS = [
    { value: 'google/gemini-3.1-pro-preview-custom-tools', label: 'Google: Gemini 3.1 Pro Preview Custom Tools' },
    { value: 'meta-llama/llama-3-8b-instruct', label: 'Llama 3 8B Instruct' },
    { value: 'meta-llama/llama-3-70b-instruct', label: 'Llama 3 70B Instruct' },
    { value: 'mistralai/mixtral-8x7b-instruct', label: 'Mixtral 8x7B Instruct' },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'llama3-70b-8192', label: 'Groq: Llama 3 70B' },
];

interface AppDoc {
    app_id: string;
    app_name: string;
    model_name: string;
    knowledge_base_ids: string[];
    created_at: string;
}

export default function ApplicationsPage() {
    const router = useRouter();
    const [apps, setApps] = useState<AppDoc[]>([]);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newAppName, setNewAppName] = useState('');
    const [newModel, setNewModel] = useState(MODELS[0].value);
    const [loading, setLoading] = useState(false);
    const [createdKey, setCreatedKey] = useState('');
    const [copiedKey, setCopiedKey] = useState(false);

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
    }, []);

    const createApp = async () => {
        if (!newAppName.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/applications/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ app_name: newAppName, model_name: newModel })
            });
            const data = await res.json();
            if (data.api_key) {
                setCreatedKey(data.api_key);
            }
            setNewAppName('');
            fetchApps();
        } catch { }
        setLoading(false);
    };

    const deleteApp = async (appId: string) => {
        try {
            await fetch(`http://localhost:5000/api/applications/${appId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchApps();
        } catch { }
    };

    const filteredApps = apps.filter(a => a.app_name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Navbar />
            <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 animate-fade-in">
                    <h1 className="text-3xl font-bold">Applications</h1>
                    <button onClick={() => { setShowCreate(true); setCreatedKey(''); }} className="px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Create App
                    </button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4 mb-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search apps..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                        />
                    </div>
                </div>

                {/* Create Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 animate-slide-down">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">{createdKey ? 'App Created!' : 'Create New App'}</h3>
                                <button onClick={() => setShowCreate(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {!createdKey ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">App Name</label>
                                        <input
                                            type="text"
                                            value={newAppName}
                                            onChange={(e) => setNewAppName(e.target.value)}
                                            placeholder="My AI Chatbot"
                                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">AI Model</label>
                                        <select
                                            value={newModel}
                                            onChange={(e) => setNewModel(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-blue-500 text-sm appearance-none"
                                        >
                                            {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={createApp} disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 text-sm">
                                        {loading ? 'Creating...' : 'Create Application'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                        <p className="text-sm text-green-400 font-semibold mb-2">⚠️ Save your API key now. It won&apos;t be shown again.</p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-xs bg-[var(--bg-primary)] px-3 py-2 rounded border border-[var(--border-color)] text-[var(--text-primary)] font-mono break-all">
                                                {createdKey}
                                            </code>
                                            <button onClick={() => { navigator.clipboard.writeText(createdKey); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }} className="px-3 py-2 rounded border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] transition-colors">
                                                {copiedKey ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowCreate(false)} className="w-full py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg text-sm hover:bg-[var(--bg-card-hover)] transition-colors">
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* App List */}
                {filteredApps.length === 0 ? (
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-16 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="w-16 h-16 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center mx-auto mb-4">
                            <AppWindow className="w-8 h-8 text-[var(--text-muted)]" />
                        </div>
                        <p className="text-lg font-semibold mb-1">No applications found</p>
                        <p className="text-sm text-[var(--text-muted)] mb-4">Create your first AI application to get started.</p>
                        <button onClick={() => setShowCreate(true)} className="px-4 py-2 border border-[var(--border-color)] rounded-lg text-sm hover:bg-[var(--bg-card-hover)] transition-colors inline-flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Create App
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredApps.map((app, i) => (
                            <div key={app.app_id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 flex items-center justify-between hover:border-[var(--border-light)] transition-colors animate-fade-in" style={{ animationDelay: `${0.05 * i}s` }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <AppWindow className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{app.app_name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{app.model_name} · {app.knowledge_base_ids?.length || 0} KBs</p>
                                    </div>
                                </div>
                                <button onClick={() => deleteApp(app.app_id)} className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
