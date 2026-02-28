"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { User, Key, Trash2 } from 'lucide-react';

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
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Navbar />
            <main className="pt-24 pb-12 px-6 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 animate-fade-in">Settings</h1>

                {/* Profile */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <User className="w-5 h-5 text-blue-400" />
                        <h3 className="text-base font-semibold">Profile</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-[var(--text-muted)] block mb-1">Name</label>
                            <p className="text-sm text-[var(--text-primary)]">{user.name}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--text-muted)] block mb-1">Email</label>
                            <p className="text-sm text-[var(--text-primary)]">{user.email}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--text-muted)] block mb-1">User ID</label>
                            <p className="text-xs text-[var(--text-secondary)] font-mono">{user.id}</p>
                        </div>
                    </div>
                </div>

                {/* API Keys info */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <Key className="w-5 h-5 text-orange-400" />
                        <h3 className="text-base font-semibold">API Keys</h3>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                        API keys are generated per application. Go to the{' '}
                        <a href="/applications" className="text-blue-400 hover:underline">Applications</a>{' '}
                        page to create a new app and get your API key.
                    </p>
                </div>

                {/* Danger */}
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <Trash2 className="w-5 h-5 text-red-400" />
                        <h3 className="text-base font-semibold text-red-400">Danger Zone</h3>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Deleting your account will permanently remove all apps, knowledge bases, and data.
                    </p>
                    <button className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
                        Delete Account
                    </button>
                </div>
            </main>
        </div>
    );
}
