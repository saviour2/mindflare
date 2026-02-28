"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { AppWindow, Database, Plus, Copy, Check, ExternalLink, ArrowRight, Zap, Shield, Layout, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [copied, setCopied] = useState(false);
    const [appCount, setAppCount] = useState(0);
    const [kbCount, setKbCount] = useState(0);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
            return;
        }

        if (!user) return;

        // In a real app we would get a token from Auth0 using getAccessTokenSilently
        const token = localStorage.getItem('token') || 'temp';

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

        // Fetch logs
        fetch('http://localhost:5000/api/analytics/logs', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => setLogs(d.logs || []))
            .catch(() => { });
    }, [router]);

    const copyId = () => {
        if (user?.sub) {
            navigator.clipboard.writeText(user.sub);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading || !user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 bg-organic-grid opacity-20 pointer-events-none" />
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-base/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[40vw] h-[40vw] bg-accent-cyan/5 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-base/10 border border-blue-base/20 text-blue-light text-xs font-bold uppercase tracking-wider mb-4"
                        >
                            <Sparkles className="w-3 h-3" /> Dashboard
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl md:text-5xl font-serif font-medium mb-3"
                        >
                            Welcome back, <span className="text-blue-light italic">{user.name || user.email?.split('@')[0]}</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-zinc-500 max-w-lg"
                        >
                            Your cognitive infrastructure is ready. Monitor your agents and manage your intelligence pipelines.
                        </motion.p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: API & Banner */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* SDK Banner */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative overflow-hidden rounded-[2.5rem] p-8 border border-blue-base/20 bg-gradient-to-br from-blue-base/[0.05] to-transparent"
                        >
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="w-20 h-20 rounded-3xl bg-blue-base flex items-center justify-center shrink-0 shadow-lg shadow-blue-base/20">
                                    <Zap className="w-10 h-10 text-black fill-current" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-serif font-medium mb-2">Mindflare SDK v0.2.0</h3>
                                    <p className="text-zinc-400 mb-6 max-w-md">Our production-ready Node.js client is now available for enterprise integration.</p>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                        <Link href="/docs">
                                            <Button className="rounded-full bg-blue-base text-white hover:bg-blue-light px-8">
                                                Documentation
                                            </Button>
                                        </Link>
                                        <a href="https://www.npmjs.com/package/mindflare-sdk" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-light hover:text-white transition-colors">
                                            NPM Package <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-8 text-blue-base/5 pointer-events-none">
                                <Layout className="w-40 h-40" />
                            </div>
                        </motion.div>

                        {/* Client ID Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="rounded-[2.5rem]">
                                <CardHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Shield className="w-4 h-4 text-accent-cyan" />
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Security Credentials</span>
                                    </div>
                                    <CardTitle>Global Client ID</CardTitle>
                                    <CardDescription>Use this unique identifier to authenticate your SDK calls across all applications.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-mono text-sm text-blue-light break-all flex items-center">
                                            {user.sub || 'mf_user_********************'}
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={copyId}
                                            className="h-full rounded-2xl px-6 border-white/10 hover:bg-white/5"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            <span className="ml-2 hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Column: Stats & Links */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="rounded-[2.5rem] border-accent-cyan/20 bg-accent-cyan/[0.02]">
                                <CardContent className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan border border-accent-cyan/20">
                                            <AppWindow className="w-6 h-6" />
                                        </div>
                                        <Link href="/applications" className="p-2 hover:bg-white/5 rounded-full transition-colors" title="View Apps">
                                            <ArrowRight className="w-5 h-5 text-zinc-500" />
                                        </Link>
                                    </div>
                                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-2">Engines Deployed</p>
                                    <div className="flex items-end gap-2 mb-6">
                                        <h2 className="text-5xl font-serif">{appCount}</h2>
                                        <span className="text-zinc-500 mb-2 font-medium">/ 10</span>
                                    </div>
                                    <Link href="/applications">
                                        <Button className="w-full rounded-xl bg-accent-cyan text-white hover:bg-accent-cyan/80">
                                            <Plus className="w-4 h-4 mr-2" /> New Agent
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="rounded-[2.5rem] border-purple-500/20 bg-purple-500/[0.02]">
                                <CardContent className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <Link href="/knowledge-base" className="p-2 hover:bg-white/5 rounded-full transition-colors" title="View Knowledge Bases">
                                            <ArrowRight className="w-5 h-5 text-zinc-500" />
                                        </Link>
                                    </div>
                                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-2">Contextual Chunks</p>
                                    <div className="flex items-end gap-2 mb-6">
                                        <h2 className="text-5xl font-serif">{kbCount}</h2>
                                        <span className="text-zinc-500 mb-2 font-medium">Stores</span>
                                    </div>
                                    <Link href="/knowledge-base">
                                        <Button variant="outline" className="w-full rounded-xl border-purple-500/20 hover:bg-purple-500/5 hover:text-purple-400">
                                            <Plus className="w-4 h-4 mr-2" /> Connect Data
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-blue-base" />
                            <h2 className="text-2xl font-serif font-medium">Neural Activity Feed</h2>
                        </div>
                        <Button variant="ghost" className="text-xs text-zinc-500 hover:text-white">
                            View all logs <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                    </div>

                    <Card className="rounded-[2.5rem] overflow-hidden">
                        <div className="divide-y divide-white/5">
                            {logs.length > 0 ? logs.map((item, i) => (
                                <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            item.status === 'success' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-blue-base animate-pulse"
                                        )} />
                                        <div>
                                            <p className="text-sm font-medium text-white">{item.event}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">{item.app_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-500 font-sans">{item.latency}s latency</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-zinc-500 font-sans italic">
                                    No neural activity detected yet.
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}
