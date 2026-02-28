"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Activity, Zap, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#3b82f6', '#7c3aed', '#06b6d4', '#f59e0b'];

export default function AnalyticsPage() {
    const router = useRouter();
    const [stats, setStats] = useState({ totalRequests: 0, totalTokens: 0, totalCost: 0, avgResponse: 0 });
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [modelDist, setModelDist] = useState<any[]>([]);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
        if (!token) { router.push('/login'); return; }

        // Generate sample chart data (will be replaced by real backend analytics endpoint)
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                requests: 0,
                tokens: 0,
                latency: 0,
            });
        }
        setDailyData(days);
        setModelDist([
            { name: 'Llama 3 8B', value: 0 },
            { name: 'Mistral 7B', value: 0 },
            { name: 'DeepSeek', value: 0 },
        ]);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Navbar />
            <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                        <p className="text-[var(--text-secondary)] text-sm mt-1">Track your API usage, token consumption, and financial statement</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] focus:outline-none">
                            <option>All Apps</option>
                        </select>
                        <select className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] focus:outline-none">
                            <option>Last 30 days</option>
                            <option>Last 7 days</option>
                            <option>Last 24 hours</option>
                        </select>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {[
                        { icon: <Activity className="w-5 h-5" />, label: 'Total Requests', value: stats.totalRequests.toString(), color: 'blue' },
                        { icon: <Zap className="w-5 h-5" />, label: 'Total Tokens', value: stats.totalTokens.toString(), color: 'purple' },
                        { icon: <DollarSign className="w-5 h-5" />, label: 'Total Cost', value: `$${stats.totalCost.toFixed(4)}`, color: 'orange' },
                        { icon: <Clock className="w-5 h-5" />, label: 'Avg Response', value: `${stats.avgResponse} ms`, color: 'cyan' },
                    ].map((s, i) => (
                        <div key={i} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                                    s.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                                        s.color === 'orange' ? 'bg-orange-500/10 text-orange-400' :
                                            'bg-cyan-500/10 text-cyan-400'
                                }`}>
                                {s.icon}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mb-1">{s.label}</p>
                            <p className="text-2xl font-bold">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Daily Requests Chart */}
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-semibold">Daily Requests</h3>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b6b80' }} axisLine={{ stroke: '#2a2a3a' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#6b6b80' }} axisLine={{ stroke: '#2a2a3a' }} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '8px', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="requests" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReq)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Token Usage Chart */}
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-semibold">Token Usage</h3>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="colorTok" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b6b80' }} axisLine={{ stroke: '#2a2a3a' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#6b6b80' }} axisLine={{ stroke: '#2a2a3a' }} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '8px', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="tokens" stroke="#7c3aed" fillOpacity={1} fill="url(#colorTok)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bottom charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Response Time */}
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            <h3 className="text-sm font-semibold">Response Time Trend</h3>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b6b80' }} axisLine={{ stroke: '#2a2a3a' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#6b6b80' }} axisLine={{ stroke: '#2a2a3a' }} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '8px', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="latency" stroke="#06b6d4" fillOpacity={1} fill="url(#colorLat)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Model Distribution */}
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-4 h-4 text-orange-400" />
                            <h3 className="text-sm font-semibold">Model Distribution</h3>
                        </div>
                        <div className="h-64 flex items-center justify-center">
                            {modelDist.every(m => m.value === 0) ? (
                                <p className="text-sm text-[var(--text-muted)]">No data yet</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={modelDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                            {modelDist.map((_, i) => (
                                                <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: '8px', fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2">
                            {modelDist.map((m, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                                    {m.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
