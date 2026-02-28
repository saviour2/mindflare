"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Activity, Zap, DollarSign, Clock, BarChart3, ChevronDown, Filter, Sparkles, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#EAB308', '#06B6D4', '#8B5CF6', '#F97316'];

export default function AnalyticsPage() {
    const router = useRouter();
    const [stats, setStats] = useState({ totalRequests: 0, totalTokens: 0, totalCost: 0, avgResponse: 0 });
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [modelDist, setModelDist] = useState<any[]>([]);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
        if (!token) { router.push('/login'); return; }

        // Generate sample chart data
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                requests: Math.floor(Math.random() * 100),
                tokens: Math.floor(Math.random() * 5000),
                latency: Math.floor(Math.random() * 200) + 100,
            });
        }
        setDailyData(days);
        setStats({
            totalRequests: days.reduce((acc, curr) => acc + curr.requests, 0),
            totalTokens: days.reduce((acc, curr) => acc + curr.tokens, 0),
            totalCost: days.reduce((acc, curr) => acc + curr.tokens, 0) * 0.00002,
            avgResponse: Math.floor(days.reduce((acc, curr) => acc + curr.latency, 0) / days.length)
        });
        setModelDist([
            { name: 'Gemini 3.1 Pro', value: 400 },
            { name: 'GPT-4o', value: 300 },
            { name: 'Llama 3 70B', value: 300 },
            { name: 'Claude 3.5 Sonnet', value: 200 },
        ]);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 bg-organic-grid opacity-20 pointer-events-none" />
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[30%] left-[-10%] w-[50vw] h-[50vw] bg-accent-cyan/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] bg-gold-base/5 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl font-serif font-medium"
                            >
                                Operations Analytics
                            </motion.h1>
                            <div className="px-2 py-0.5 rounded-full bg-gold-base/10 border border-gold-base/20 text-[10px] uppercase font-bold tracking-widest text-gold-light">Live</div>
                        </div>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-zinc-500"
                        >
                            Real-time metrics for your neural infrastructure and token economy.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4"
                    >
                        <Button variant="outline" className="rounded-full h-12 px-6 border-white/10 hover:bg-white/5">
                            <Filter className="w-4 h-4 mr-2" /> Global View <ChevronDown className="w-3.5 h-3.5 ml-2 text-zinc-500" />
                        </Button>
                        <Button variant="outline" className="rounded-full h-12 px-6 border-white/10 hover:bg-white/5">
                            Last 30 Days <ChevronDown className="w-3.5 h-3.5 ml-2 text-zinc-500" />
                        </Button>
                    </motion.div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { icon: <Activity className="w-5 h-5" />, label: 'Neural Requests', value: stats.totalRequests.toLocaleString(), trend: '+12%', color: 'blue' },
                        { icon: <Zap className="w-5 h-5" />, label: 'Token Throughput', value: stats.totalTokens.toLocaleString(), trend: '+8.4%', color: 'purple' },
                        { icon: <DollarSign className="w-5 h-5" />, label: 'Ecological Cost', value: `$${stats.totalCost.toFixed(2)}`, trend: '-2.1%', color: 'gold' },
                        { icon: <Clock className="w-5 h-5" />, label: 'Avg Latency', value: `${stats.avgResponse}ms`, trend: '-14ms', color: 'cyan' },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="rounded-[2rem] hover:border-white/20 transition-all group overflow-hidden relative">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            s.color === 'blue' ? "bg-blue-500/10 text-blue-400" :
                                                s.color === 'purple' ? "bg-purple-500/10 text-purple-400" :
                                                    s.color === 'gold' ? "bg-gold-base/10 text-gold-base" :
                                                        "bg-cyan-500/10 text-cyan-400"
                                        )}>
                                            {s.icon}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                            s.trend.startsWith('+') ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                        )}>
                                            {s.trend}
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-serif font-medium mb-1">{s.value}</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{s.label}</p>
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Traffic Chart */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="rounded-[2.5rem] h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-8">
                                <div>
                                    <CardTitle className="text-xl font-serif">Neural Traffic</CardTitle>
                                    <CardDescription>Requests and token consumption over time</CardDescription>
                                </div>
                                <TrendingUp className="w-5 h-5 text-gold-base opacity-50" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyData}>
                                            <defs>
                                                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 10, fill: '#52525b' }}
                                                axisLine={false}
                                                tickLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 10, fill: '#52525b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#0a0a0a',
                                                    border: '1px solid #ffffff10',
                                                    borderRadius: '16px',
                                                    fontSize: '12px'
                                                }}
                                            />
                                            <Area type="monotone" dataKey="requests" stroke="#EAB308" fillOpacity={1} fill="url(#colorReq)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Model Dist */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <Card className="rounded-[2.5rem] h-full">
                            <CardHeader>
                                <CardTitle className="text-xl font-serif">Model Allocation</CardTitle>
                                <CardDescription>Compute distribution by engine</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={modelDist}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={8}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {modelDist.map((_, i) => (
                                                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#0a0a0a',
                                                    border: '1px solid #ffffff10',
                                                    borderRadius: '16px',
                                                    fontSize: '12px'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Active</span>
                                        <span className="text-2xl font-serif">4</span>
                                    </div>
                                </div>
                                <div className="space-y-3 mt-6">
                                    {modelDist.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                <span className="text-xs text-zinc-400">{m.name}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-zinc-600">{(m.value / 12).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Response Time Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="rounded-[2.5rem]">
                        <CardHeader>
                            <CardTitle className="text-xl font-serif">Neural Latency Trend</CardTitle>
                            <CardDescription>Response time volatility across global nodes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyData}>
                                        <defs>
                                            <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="date" hide />
                                        <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#0a0a0a',
                                                border: '1px solid #ffffff10',
                                                borderRadius: '16px'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="latency" stroke="#06B6D4" fillOpacity={1} fill="url(#colorLat)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}

