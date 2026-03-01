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

    const [cliToken, setCliToken] = useState('');
    const [generatingToken, setGeneratingToken] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);

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

    const handleGenerateCliToken = async () => {
        setGeneratingToken(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/cli-token', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (res.ok && data.cli_token) {
                setCliToken(data.cli_token);
            } else {
                alert('Failed to generate token');
            }
        } catch {
            alert('Network error');
        }
        setGeneratingToken(false);
    };

    return (
        <div className="min-h-screen text-retro-white">
            <Navbar />

            {/* Dark backdrop overlay */}
            <div className="fixed inset-0 z-0 bg-[#2F3947]/60 backdrop-blur-[2px] pointer-events-none" />

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-pixel mb-2 text-retro-white"
                        >
                            System Configuration
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-retro-muted"
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
                        <Card className=" overflow-hidden">
                            <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="w-24 h-24 bg-retro-panel border-3 border-retro-cyan shadow-pixel-cyan flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-retro-cyan/10 opacity-0 group-hover:opacity-100 transition-none" />
                                    <span className="text-3xl font-pixel text-retro-cyan relative z-10">{user?.email?.[0].toUpperCase()}</span>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-pixel mb-1 text-retro-white">Neural Identity</h3>
                                    <p className="text-retro-muted font-sans mb-4">{user?.email}</p>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                        <div className="px-3 py-1 bg-retro-panel border-3 border-retro-border flex items-center gap-2">
                                            <Shield className="w-3 h-3 text-retro-cyan" />
                                            <span className="text-[10px] font-bold text-retro-muted uppercase tracking-widest">Verified Account</span>
                                        </div>
                                        <div className="px-3 py-1 bg-retro-panel border-3 border-retro-border flex items-center gap-2">
                                            <Fingerprint className="w-3 h-3 text-retro-cyan" />
                                            <span className="text-[10px] font-bold text-retro-muted uppercase tracking-widest">Biometric Link Active</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" className=" h-12 px-8 border-retro-border hover:bg-retro-panel">
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
                        <Card className=" overflow-hidden">
                            <div className="p-8 md:p-10">
                                <h3 className="text-xl font-pixel mb-8 text-retro-white">Access Infrastructure</h3>
                                <div className="space-y-4">
                                    <div
                                        onClick={keys ? undefined : handleRevealKeys}
                                        className="flex flex-col p-6 bg-retro-panel border-3 border-retro-border group hover:border-retro-muted transition-none cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-retro-card flex items-center justify-center border-3 border-retro-border">
                                                    <Key className="w-5 h-5 text-retro-cyan" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-retro-white">Manage Global API Keys</p>
                                                    <p className="text-[10px] text-retro-muted uppercase font-bold tracking-widest mt-0.5">Protected Vault</p>
                                                </div>
                                            </div>
                                            {!keys && (
                                                <div className="flex items-center gap-2">
                                                    {isRevealing ? <p className="text-xs text-retro-cyan">Verifying...</p> : <ChevronRight className="w-4 h-4 text-retro-dim group-hover:text-retro-white transition-none" />}
                                                </div>
                                            )}
                                        </div>

                                        {keys && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-6 pt-6 border-t border-retro-border space-y-4 cursor-default"
                                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-xs text-retro-muted font-sans">For strict-security APIs, provide your App ID and API Key pair.</p>
                                                    <Button variant="outline" size="sm" onClick={() => setKeys(null)} className="h-8 text-xs border-retro-border">Lock Vault</Button>
                                                </div>
                                                {Object.entries(keys).map(([appId, secret]) => (
                                                    <div key={appId} className="p-4 bg-retro-card border-3 border-retro-border space-y-3">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex-1">
                                                                <p className="text-[10px] uppercase tracking-widest text-retro-muted font-bold mb-1">App ID</p>
                                                                <code className="text-xs text-retro-white font-mono select-all bg-retro-panel px-2 py-1 inline-block">{appId}</code>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(appId)} className="h-8 hover:bg-retro-panel">Copy ID</Button>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex-1">
                                                                <p className="text-[10px] uppercase tracking-widest text-retro-muted font-bold mb-1">API Key</p>
                                                                <code className="text-xs text-emerald-400 font-mono select-all bg-emerald-400/10 px-2 py-1 inline-block">{secret}</code>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(secret)} className="h-8 hover:bg-retro-panel">Copy Key</Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {Object.keys(keys).length === 0 && (
                                                    <p className="text-center text-sm text-retro-muted py-4">No applications registered yet.</p>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-6 bg-retro-panel border-3 border-retro-border group hover:border-retro-muted transition-none cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-retro-card flex items-center justify-center border-3 border-retro-border">
                                                <ChevronRight className="w-5 h-5 text-retro-cyan" />
                                            </div>
                                            <Link href="/applications">
                                                <div>
                                                    <p className="text-sm font-medium text-retro-white">Link Applications</p>
                                                    <p className="text-[10px] text-retro-muted uppercase font-bold tracking-widest mt-0.5">Manage connections</p>
                                                </div>
                                            </Link>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-retro-dim group-hover:text-retro-white transition-none" />
                                    </div>

                                    {/* CLI Access Token */}
                                    <div className="flex flex-col p-6 bg-retro-panel border-3 border-retro-border group hover:border-retro-muted transition-none">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-retro-card flex items-center justify-center border-3 border-retro-border">
                                                    <code className="text-retro-muted font-bold text-xs">CLI</code>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-retro-white">CLI Access Token</p>
                                                    <p className="text-[10px] text-retro-muted uppercase font-bold tracking-widest mt-0.5">For Terminal Login</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleGenerateCliToken}
                                                disabled={generatingToken}
                                                variant="outline" size="sm" className="h-8 border-retro-border hover:bg-retro-panel"
                                            >
                                                {generatingToken ? 'Generating...' : 'Generate Token'}
                                            </Button>
                                        </div>

                                        {cliToken && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 border-t border-retro-border space-y-3">
                                                <p className="text-xs text-retro-muted font-sans leading-relaxed">
                                                    Run <code className="text-retro-cyan">mindflare login --token YOUR_TOKEN</code> in your terminal to authenticate without a password.
                                                </p>
                                                <div className="flex items-center justify-between gap-4 p-4 bg-retro-card border-3 border-retro-border">
                                                    <code className="flex-1 text-xs text-emerald-400 font-mono select-all truncate bg-emerald-400/10 px-3 py-2 ">{cliToken}</code>
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => { navigator.clipboard.writeText(cliToken); setCopiedToken(true); setTimeout(() => setCopiedToken(false), 2000); }}
                                                        className="h-8 hover:bg-retro-panel shrink-0"
                                                    >
                                                        {copiedToken ? 'Copied!' : 'Copy'}
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
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
                        <Card className="border-3 border-red-500 shadow-[4px_4px_0px_#7f1d1d] overflow-hidden">
                            <div className="p-8 md:p-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-retro-card flex items-center justify-center border-3 border-red-500">
                                        <Trash2 className="w-6 h-6 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-pixel text-red-500">Decommission Infrastructure</h3>
                                </div>
                                <p className="text-retro-muted text-sm font-sans mb-8 max-w-2xl leading-relaxed">
                                    Executing this command will permanently purge all neural applications, knowledge bases, and architectural data associated with this identity. This operation is irreversible.
                                </p>
                                <Button
                                    onClick={handlePurge}
                                    variant="outline"
                                    className="h-12 border-3 border-red-500 text-red-500 hover:bg-red-500/10 shadow-[4px_4px_0px_#7f1d1d] px-8 font-pixel"
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

