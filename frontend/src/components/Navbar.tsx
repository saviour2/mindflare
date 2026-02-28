"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, LogOut, User, ChevronDown } from 'lucide-react';

export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-[var(--text-primary)]">Mindflare<span className="text-blue-400">AI</span></span>
                </Link>

                {/* Center Nav */}
                {!user && (
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">How It Works</a>
                    </div>
                )}

                {user && (
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
                            Dashboard <ChevronDown className="w-3 h-3" />
                        </Link>
                        <Link href="/applications" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Apps</Link>
                        <Link href="/knowledge-base" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Knowledge Base</Link>
                        <Link href="/analytics" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Analytics</Link>
                    </div>
                )}

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {!user ? (
                        <>
                            <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5">
                                Log in
                            </Link>
                            <Link href="/signup" className="text-sm bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
                                Sign up
                            </Link>
                        </>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <span className="hidden md:block">{user.name}</span>
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 top-12 w-48 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl animate-slide-down">
                                    <div className="p-3 border-b border-[var(--border-color)]">
                                        <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                                    </div>
                                    <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors">
                                        <User className="w-4 h-4" /> Settings
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-red)] hover:bg-[var(--bg-card-hover)] transition-colors rounded-b-lg"
                                    >
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
