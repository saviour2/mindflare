"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Eye, EyeOff, Shield, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 bg-organic-grid opacity-20 pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-gold-base/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-accent-cyan/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center mb-10"
                >
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gold-base flex items-center justify-center shadow-lg shadow-gold-base/20">
                            <Zap className="w-6 h-6 text-black fill-current" />
                        </div>
                        <span className="text-3xl font-serif font-medium tracking-tight">Mindflare<span className="text-gold-light italic">AI</span></span>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-10 shadow-2xl overflow-hidden relative"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-base/50 to-transparent" />

                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-serif font-medium mb-3">Welcome Back</h2>
                        <p className="text-zinc-500 font-sans tracking-wide">Enter your credentials to access your console.</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3"
                            >
                                <Shield className="w-4 h-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Cognitive Protocol (Email)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="architect@mindflare.ai"
                                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-gold-base/50 transition-all font-sans text-sm"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Access Key (Password)</label>
                                <Link href="#" className="text-[10px] font-bold text-gold-light/60 hover:text-gold-light uppercase tracking-widest transition-colors">Forgot Key?</Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-gold-base/50 transition-all font-sans text-sm pr-12"
                                    required
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-gold-base text-black hover:bg-gold-light shadow-lg shadow-gold-base/20 font-bold transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 animate-spin" /> Authenticating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Initialize Core <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-zinc-500 text-sm font-sans">
                            New to the infrastructure?{' '}
                            <Link href="/signup" className="text-gold-light font-bold hover:underline underline-offset-4 decoration-gold-light/30">Create an account</Link>
                        </p>
                    </div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-center text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]"
                >
                    Secure Enterprise Intelligent Systems
                </motion.p>
            </div>
        </div>
    );
}

