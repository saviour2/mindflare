"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { User, Key, Trash2, Shield, Heart, Fingerprint, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [keys, setKeys] = useState<Record<string, string> | null>(null);
    const [revealError, setRevealError] = useState('');
    const [isRevealing, setIsRevealing] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) { router.push('/'); return; }
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    const handlePurge = async () => {
        if (!confirm("CRITICAL WARNING: This will permanently delete your identity and all neural assets. Proceed?")) return;
        const password = prompt("Please type 'PURGE' to confirm deletion:");
        if (password !== 'PURGE') return;

        try {
            const res = await fetch('http://localhost:5000/api/auth/purge', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                localStorage.clear();
                router.push('/signup');
            }
        } catch { }
    };

    const handleRevealKeys = async () => {
        const password = prompt("Enter your account password to reveal Global API Keys:");
        if (!password) return;

        setIsRevealing(true);
        setRevealError('');
        try {
            const res = await fetch('http://localhost:5000/api/applications/reveal-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (res.ok) {
                setKeys(data.keys);
            } else {
                setRevealError(data.error || 'Failed to authorize.');
                alert('Authorization failed: ' + (data.error || 'Incorrect password'));
            }
        } catch (err) {
            alert('Failed to connect to security server.');
        } finally {
            setIsRevealing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 bg-organic-grid opacity-20 pointer-events-none" />
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[30%] left-[-10%] w-[50vw] h-[50vw] bg-accent-cyan/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] bg-blue-base/5 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-serif font-medium mb-2"
                        >
                            System Configuration
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-zinc-500"
                        >
                            Manage your cognitive identity and security protocols.
                        </motion.p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Profile Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <Card className="rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="w-24 h-24 rounded-3xl bg-blue-base/10 border border-blue-base/20 flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-base/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-3xl font-serif text-blue-base relative z-10">{user?.email?.[0].toUpperCase()}</span>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-serif font-medium mb-1">Neural Identity</h3>
                                    <p className="text-zinc-400 font-sans mb-4">{user?.email}</p>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                                            <Shield className="w-3 h-3 text-blue-base" />
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verified Account</span>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                                            <Fingerprint className="w-3 h-3 text-accent-cyan" />
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Biometric Link Active</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" className="rounded-full h-12 px-8 border-white/10 hover:bg-white/5">
                                    Update Profile
                                </Button>
                            </div>
                        </Card>
                    </motion.div>

                    {/* API and Access */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 md:p-10">
                                <h3 className="text-xl font-serif font-medium mb-8">Access Infrastructure</h3>
                                <div className="space-y-4">
                                    <div
                                        onClick={keys ? undefined : handleRevealKeys}
                                        className="flex flex-col p-6 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/20">
                                                    <Key className="w-5 h-5 text-accent-cyan" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Manage Global API Keys</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">Protected Vault</p>
                                                </div>
                                            </div>
                                            {!keys && (
                                                <div className="flex items-center gap-2">
                                                    {isRevealing ? <p className="text-xs text-blue-base">Verifying...</p> : <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />}
                                                </div>
                                            )}
                                        </div>

                                        {keys && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-6 pt-6 border-t border-white/10 space-y-4 cursor-default"
                                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-xs text-zinc-400 font-sans">For strict-security APIs, provide your App ID and API Key pair.</p>
                                                    <Button variant="outline" size="sm" onClick={() => setKeys(null)} className="h-8 text-xs border-white/10">Lock Vault</Button>
                                                </div>
                                                {Object.entries(keys).map(([appId, secret]) => (
                                                    <div key={appId} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex-1">
                                                                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">App ID</p>
                                                                <code className="text-xs text-zinc-300 font-mono select-all bg-white/5 px-2 py-1 rounded inline-block">{appId}</code>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(appId)} className="h-8 hover:bg-white/5">Copy ID</Button>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex-1">
                                                                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">API Key</p>
                                                                <code className="text-xs text-emerald-400 font-mono select-all bg-emerald-400/10 px-2 py-1 rounded inline-block">{secret}</code>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(secret)} className="h-8 hover:bg-white/5">Copy Key</Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {Object.keys(keys).length === 0 && (
                                                    <p className="text-center text-sm text-zinc-500 py-4">No applications registered yet.</p>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-base/10 flex items-center justify-center border border-blue-base/20">
                                                <ChevronRight className="w-5 h-5 text-blue-base" />
                                            </div>
                                            <Link href="/applications">
                                                <div>
                                                    <p className="text-sm font-medium">Link Applications</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">Manage connections</p>
                                                </div>
                                            </Link>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Danger Zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <Card className="rounded-[2.5rem] border-red-500/20 bg-red-500/[0.02] overflow-hidden">
                            <div className="p-8 md:p-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                        <Trash2 className="w-6 h-6 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-serif text-red-500">Decommission Infrastructure</h3>
                                </div>
                                <p className="text-zinc-500 text-sm font-sans mb-8 max-w-2xl leading-relaxed">
                                    Executing this command will permanently purge all neural applications, knowledge bases, and architectural data associated with this identity. This operation is irreversible.
                                </p>
                                <Button
                                    onClick={handlePurge}
                                    variant="outline"
                                    className="rounded-full h-12 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 px-8 transition-all"
                                >
                                    Initiate Purge Sequence
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

