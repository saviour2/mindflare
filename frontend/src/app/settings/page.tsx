"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { User, Key, Trash2, Shield, Heart, Fingerprint, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (!token || !storedUser) { router.push('/login'); return; }
        setUser(JSON.parse(storedUser));
    }, []);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 bg-organic-grid opacity-20 pointer-events-none" />
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-gold-base/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-[20%] left-[-10%] w-[40vw] h-[40vw] bg-accent-cyan/5 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-4xl mx-auto">
                <div className="mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-serif font-medium mb-3"
                    >
                        Infrastructure Settings
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-500 font-sans"
                    >
                        Manage your architect profile and security protocols.
                    </motion.p>
                </div>

                <div className="space-y-8">
                    {/* Profile */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <Card className="rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 md:p-10">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-12 h-12 rounded-2xl bg-gold-base/10 flex items-center justify-center border border-gold-base/20">
                                        <Fingerprint className="w-6 h-6 text-gold-base" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-serif">Architect Profile</h3>
                                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-1">Core Identity</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Identity Name</label>
                                        <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-sans text-sm">
                                            {user.name}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Cognitive Protocol (Email)</label>
                                        <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-sans text-sm">
                                            {user.email}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Universal Identifier</label>
                                        <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 font-mono text-xs">
                                            {user.id}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-end">
                                    <Button variant="outline" className="rounded-full h-12 border-white/10 hover:bg-white/5 px-8">
                                        Update Identity
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* API Keys info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="rounded-[2.5rem] overflow-hidden group">
                            <div className="p-8 md:p-10 relative">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/20 group-hover:bg-accent-cyan/20 transition-colors">
                                            <Key className="w-6 h-6 text-accent-cyan" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-serif italic">Access Provisioning</h3>
                                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-1">Application Hub</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 max-w-md">
                                        <p className="text-zinc-400 text-sm font-sans leading-relaxed">
                                            Credentials and cryptographic keys are managed within each specialized application.
                                        </p>
                                    </div>

                                    <Button variant="outline" className="rounded-full h-14 px-8 border-white/10 hover:bg-white/5" onClick={() => router.push('/applications')}>
                                        Manage Apps <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Danger */}
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
                                <Button variant="outline" className="rounded-full h-12 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 px-8 transition-all">
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

