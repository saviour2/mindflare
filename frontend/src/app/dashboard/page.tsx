"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { AppWindow, Database, Plus, Copy, Check, ExternalLink, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [appCount, setAppCount] = useState(0);
    const [kbCount, setKbCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (!token || !storedUser) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(storedUser));

        // Fetch counts
        fetch('http://localhost:5000/api/applications/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => setAppCount(d.applications?.length || 0))
            .catch(() => { });

        fetch('http://localhost:5000/api/knowledge_base/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => setKbCount(d.knowledge_bases?.length || 0))
            .catch(() => { });
    }, [router]);

    const copyId = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Navbar />
            <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
                {/* Welcome */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold">Welcome back</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Manage your apps and knowledge bases.</p>
                </div>

                {/* SDK Banner */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 mb-6 flex items-center justify-between animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <AppWindow className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Mindflare SDK is now live</p>
                            <p className="text-xs text-[var(--text-muted)]">Integrate your AI apps with our official Node.js client.</p>
                        </div>
                    </div>
                    <a href="https://www.npmjs.com/package/mindflare-sdk" target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1">
                        View on NPM <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                {/* Client ID */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                    <h3 className="text-base font-semibold mb-3">Your Client ID</h3>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] font-mono truncate">
                            {user.id || 'Loading...'}
                        </div>
                        <button
                            onClick={copyId}
                            className="px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] transition-colors flex items-center gap-2 text-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">This Client ID is fixed and unique to your account. Use it to initialize the SDK.</p>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {/* Active Applications */}
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <AppWindow className="w-5 h-5 text-purple-400" />
                                </div>
                            </div>
                            <Link href="/applications" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                View all <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <p className="text-3xl font-bold mb-1">{appCount}</p>
                        <p className="text-sm text-[var(--text-secondary)]">Active Applications</p>
                        <Link href="/applications" className="flex items-center gap-1 mt-4 text-sm text-blue-400 hover:underline">
                            <Plus className="w-4 h-4" /> Create New App
                        </Link>
                    </div>

                    {/* Knowledge Bases */}
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                    <Database className="w-5 h-5 text-cyan-400" />
                                </div>
                            </div>
                            <Link href="/knowledge-base" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                View all <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <p className="text-3xl font-bold mb-1">{kbCount}</p>
                        <p className="text-sm text-[var(--text-secondary)]">Knowledge Bases</p>
                        <Link href="/knowledge-base" className="flex items-center gap-1 mt-4 text-sm text-blue-400 hover:underline">
                            <Plus className="w-4 h-4" /> Create Knowledge Base
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
