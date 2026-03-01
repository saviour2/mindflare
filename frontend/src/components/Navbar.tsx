"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Zap, LogOut, User, ChevronDown, Terminal, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, logout, login } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isLanding = pathname === '/';

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50",
                "bg-[#536175]/90 backdrop-blur-md border-b-3 border-retro-border",
                isScrolled ? "shadow-[0_4px_0_#2F3947]" : ""
            )}
        >
            {/* Retro title-bar stripe at very top — dusty rose pink */}
            <div className="h-1 w-full bg-retro-cyan" />

            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 bg-retro-cyan border-3 border-retro-cyan-dark flex items-center justify-center shadow-pixel-sm
                                    group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-none transition-none">
                        <Terminal className="w-4 h-4 text-retro-ink" />
                    </div>
                    <span className="font-pixel text-2xl text-retro-white tracking-wide">
                        Mindflare<span className="text-retro-cyan">AI</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {!user ? (
                        <>
                            <a href="#features" className="font-mono text-sm text-retro-muted hover:text-retro-cyan transition-none border-b-3 border-transparent hover:border-retro-cyan pb-0.5">Features</a>
                            <Link href="/docs" className="font-mono text-sm text-retro-muted hover:text-retro-cyan transition-none border-b-3 border-transparent hover:border-retro-cyan pb-0.5">Docs</Link>
                            <a href="#how-it-works" className="font-mono text-sm text-retro-muted hover:text-retro-cyan transition-none border-b-3 border-transparent hover:border-retro-cyan pb-0.5">How It Works</a>
                            <button onClick={login} className="font-mono text-sm text-retro-muted hover:text-retro-white transition-none ml-2">
                                Log in
                            </button>
                            <Button onClick={login} variant="default" size="sm"
                                className="font-pixel text-lg tracking-wide">
                                Sign up Free
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-6 mr-4">
                                {[
                                    { href: '/dashboard', label: 'Dashboard' },
                                    { href: '/docs', label: 'Docs' },
                                    { href: '/applications', label: 'Apps' },
                                    { href: '/knowledge-base', label: 'Knowledge Base' },
                                    { href: '/analytics', label: 'Analytics' },
                                ].map(({ href, label }) => (
                                    <Link key={href} href={href}
                                        className={cn(
                                            "font-mono text-sm transition-none border-b-3 pb-0.5",
                                            pathname === href
                                                ? "text-retro-cyan border-retro-cyan"
                                                : "text-retro-muted border-transparent hover:text-retro-white hover:border-retro-border"
                                        )}>
                                        {label}
                                    </Link>
                                ))}
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 px-3 py-1.5
                                               bg-retro-panel border-3 border-retro-border shadow-pixel-sm
                                               hover:border-retro-cyan transition-none font-mono text-sm text-retro-white"
                                >
                                    <User className="w-3.5 h-3.5 text-retro-cyan" />
                                    <span>{user.name}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-retro-muted" />
                                </button>

                                <AnimatePresence>
                                    {showDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.1, ease: "linear" }}
                                            className="absolute right-0 mt-2 w-56
                                                       bg-retro-panel border-3 border-retro-border shadow-pixel
                                                       z-[60]"
                                        >
                                            <div className="bg-retro-cyan px-3 py-1.5">
                                                <p className="font-pixel text-sm text-retro-ink">ACCOUNT</p>
                                            </div>
                                            <div className="p-2">
                                                <p className="font-mono text-xs text-retro-muted px-2 py-1 truncate">{user.email}</p>
                                                <div className="h-px bg-retro-border my-1" />
                                                <Link href="/settings" onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-2.5 px-2 py-2 font-mono text-sm text-retro-white
                                                               hover:bg-retro-card hover:text-retro-cyan transition-none">
                                                    <User className="w-4 h-4" /> Settings
                                                </Link>
                                                <button
                                                    onClick={() => { logout(); setShowDropdown(false); }}
                                                    className="w-full flex items-center gap-2.5 px-2 py-2 font-mono text-sm text-retro-white
                                                               hover:bg-retro-card hover:text-red-400 transition-none"
                                                >
                                                    <LogOut className="w-4 h-4" /> Logout
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden p-2 text-retro-cyan border-3 border-retro-border shadow-pixel-sm"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15, ease: "linear" }}
                        className="md:hidden bg-retro-panel border-t-3 border-retro-border overflow-hidden"
                    >
                        <div className="px-6 py-6 flex flex-col gap-4">
                            {!user ? (
                                <>
                                    <a href="#features" className="font-mono text-lg text-retro-white" onClick={() => setMobileMenuOpen(false)}>Features</a>
                                    <a href="#how-it-works" className="font-mono text-lg text-retro-white" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                                    <button onClick={login} className="font-mono text-lg text-retro-white text-left">Login</button>
                                    <Button className="w-full font-pixel" onClick={login}>Get Started</Button>
                                </>
                            ) : (
                                <>
                                    <Link href="/dashboard" className="font-mono text-lg text-retro-white" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                                    <Link href="/docs" className="font-mono text-lg text-retro-white" onClick={() => setMobileMenuOpen(false)}>Docs</Link>
                                    <Link href="/applications" className="font-mono text-lg text-retro-white" onClick={() => setMobileMenuOpen(false)}>Apps</Link>
                                    <Link href="/knowledge-base" className="font-mono text-lg text-retro-white" onClick={() => setMobileMenuOpen(false)}>Knowledge Base</Link>
                                    <Link href="/analytics" className="font-mono text-lg text-retro-white" onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
                                    <Button variant="outline" className="w-full text-red-400 border-red-500" onClick={logout}>Logout</Button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
