"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Zap, LogOut, User, ChevronDown, Terminal, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/');
    };

    const isLanding = pathname === '/';

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10 h-16" : "bg-transparent h-20"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:scale-110">
                        <Terminal className="w-4 h-4" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white font-serif">
                        Mindflare<span className="text-gold-base">AI</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-10">
                    {!user ? (
                        <>
                            <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
                            <Link href="/docs" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Docs</Link>
                            <a href="#how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">How It Works</a>
                            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors ml-4">
                                Log in
                            </Link>
                            <Link href="/signup">
                                <Button variant="default" className="rounded-full shadow-lg shadow-white/5">
                                    Sign up Free
                                </Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-8 mr-6">
                                <Link href="/dashboard" className={cn("text-sm font-medium transition-colors", pathname === '/dashboard' ? "text-white" : "text-zinc-400 hover:text-white")}>Dashboard</Link>
                                <Link href="/docs" className={cn("text-sm font-medium transition-colors", pathname === '/docs' ? "text-white" : "text-zinc-400 hover:text-white")}>Docs</Link>
                                <Link href="/applications" className={cn("text-sm font-medium transition-colors", pathname === '/applications' ? "text-white" : "text-zinc-400 hover:text-white")}>Apps</Link>
                                <Link href="/knowledge-base" className={cn("text-sm font-medium transition-colors", pathname === '/knowledge-base' ? "text-white" : "text-zinc-400 hover:text-white")}>Knowledge Base</Link>
                                <Link href="/analytics" className={cn("text-sm font-medium transition-colors", pathname === '/analytics' ? "text-white" : "text-zinc-400 hover:text-white")}>Analytics</Link>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-3 p-1 pl-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    <span className="text-sm font-medium text-zinc-300">{user.name}</span>
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-white/10">
                                        <User className="w-3.5 h-3.5 text-zinc-400" />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {showDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-2xl shadow-2xl p-2 z-[60]"
                                        >
                                            <div className="px-3 py-2.5 mb-1">
                                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Account</p>
                                                <p className="text-sm font-medium text-white truncate mt-1">{user.email}</p>
                                            </div>
                                            <div className="h-px bg-white/5 mx-2 my-1" />
                                            <Link href="/settings" onClick={() => setShowDropdown(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-all">
                                                <User className="w-4 h-4" /> Settings
                                            </Link>
                                            <button
                                                onClick={() => { logout(); setShowDropdown(false); }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all font-medium mt-1"
                                            >
                                                <LogOut className="w-4 h-4" /> Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-zinc-900 border-b border-white/10 overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-6">
                            {!user ? (
                                <>
                                    <a href="#features" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Features</a>
                                    <a href="#how-it-works" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                                    <Link href="/login" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                                        <Button className="w-full">Get Started</Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/dashboard" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                                    <Link href="/docs" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Docs</Link>
                                    <Link href="/applications" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Apps</Link>
                                    <Link href="/knowledge-base" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Knowledge Base</Link>
                                    <Link href="/analytics" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Analytics</Link>

                                    <Button variant="outline" className="w-full text-red-400 border-red-500/20" onClick={logout}>Logout</Button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header >
    );
}
