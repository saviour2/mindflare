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

        fetch('http://localhost:5000/api/analytics/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.summary) {
                    setStats({
                        totalRequests: data.summary.totalRequests,
                        totalTokens: data.summary.totalTokens,
                        totalCost: data.summary.totalCost,
                        avgResponse: data.summary.avgLatency * 1000 // display in ms
                    });
                }
                if (data.usageOverTime) {
                    setDailyData(data.usageOverTime.map((d: any) => ({
                        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        requests: d.count,
                        // We don't have per-day tokens/latency in simple aggregator yet, but we'll show count
                    })));
                }
                if (data.modelDistribution) {
                    setModelDist(data.modelDistribution);
                }
            })
            .catch(() => { });
    }, [token, router]);

    return (
        <div className="min-h-screen text-retro-white">
            <Navbar />

            {/* Dark backdrop overlay */}
            <div className="fixed inset-0 z-0 bg-[#2F3947]/60 backdrop-blur-[2px] pointer-events-none" />

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl font-pixel text-retro-white"
                            >
                                Operations Analytics
                            </motion.h1>
                            <div className="px-2 py-0.5 bg-retro-panel border-3 border-retro-border text-[10px] uppercase font-bold tracking-widest text-retro-cyan">Live</div>
                        </div>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-retro-muted"
                        >
                            Real-time metrics for your neural infrastructure and token economy.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4"
                    >
                        <Button variant="outline" className=" h-12 px-6 border-retro-border hover:bg-retro-panel">
                            <Filter className="w-4 h-4 mr-2" /> Global View <ChevronDown className="w-3.5 h-3.5 ml-2 text-retro-muted" />
                        </Button>
                        <Button variant="outline" className=" h-12 px-6 border-retro-border hover:bg-retro-panel">
                            Last 30 Days <ChevronDown className="w-3.5 h-3.5 ml-2 text-retro-muted" />
                        </Button>
                    </motion.div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { icon: <Activity className="w-5 h-5" />, label: 'Neural Requests', value: stats.totalRequests.toLocaleString(), trend: '+12%', color: 'blue' },
                        { icon: <Zap className="w-5 h-5" />, label: 'Token Throughput', value: stats.totalTokens.toLocaleString(), trend: '+8.4%', color: 'purple' },
                        { icon: <DollarSign className="w-5 h-5" />, label: 'Ecological Cost', value: `$${stats.totalCost.toFixed(2)}`, trend: '-2.1%', color: 'blue' },
                        { icon: <Clock className="w-5 h-5" />, label: 'Avg Latency', value: `${stats.avgResponse}ms`, trend: '-14ms', color: 'cyan' },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className=" hover:border-retro-border transition-all group overflow-hidden relative">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn(
                                            "w-10 h-10 flex items-center justify-center border-3",
                                            s.color === 'blue' ? "border-retro-cyan bg-retro-panel text-retro-cyan" :
                                                s.color === 'purple' ? "border-retro-border bg-retro-panel text-retro-muted" :
                                                    s.color === 'gold' ? "border-retro-border bg-retro-panel text-retro-cyan" :
                                                        "border-retro-cyan bg-retro-panel text-retro-cyan"
                                        )}>
                                            {s.icon}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-pixel px-1 py-0.5 border",
                                            s.trend.startsWith('+') ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
                                        )}>
                                            {s.trend}
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-pixel mb-1 text-retro-white">{s.value}</h3>
                                    <p className="text-[10px] text-retro-muted uppercase font-bold tracking-widest">{s.label}</p>
                                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-retro-cyan opacity-0 group-hover:opacity-30 transition-none" />
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
                        <Card className=" h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-8">
                                <div>
                                    <CardTitle className="text-xl font-pixel">Neural Traffic</CardTitle>
                                    <CardDescription>Requests and token consumption over time</CardDescription>
                                </div>
                                <TrendingUp className="w-5 h-5 text-retro-cyan opacity-50" />
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
                                            <CartesianGrid strokeDasharray="3 3" stroke="#3A4657" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 10, fill: '#8A95A5' }}
                                                axisLine={false}
                                                tickLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 10, fill: '#8A95A5' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#536175',
                                                    border: '3px solid #3A4657',
                                                    borderRadius: '0px',
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
                        <Card className=" h-full">
                            <CardHeader>
                                <CardTitle className="text-xl font-pixel">Model Allocation</CardTitle>
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
                                                    background: '#536175',
                                                    border: '3px solid #3A4657',
                                                    borderRadius: '0px',
                                                    fontSize: '12px'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xs text-retro-muted uppercase font-bold tracking-widest">Active</span>
                                        <span className="text-2xl font-pixel">{modelDist.length}</span>
                                    </div>
                                </div>
                                <div className="space-y-3 mt-6">
                                    {modelDist.map((m, i) => {
                                        const total = modelDist.reduce((acc, curr) => acc + curr.value, 0);
                                        const percent = total > 0 ? ((m.value / total) * 100).toFixed(1) : 0;
                                        return (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 " style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                    <span className="text-xs text-retro-muted">{m.name}</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-retro-dim">{percent}%</span>
                                            </div>
                                        );
                                    })}
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
                    <Card className="">
                        <CardHeader>
                            <CardTitle className="text-xl font-pixel">Neural Latency Trend</CardTitle>
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
                                        <CartesianGrid strokeDasharray="3 3" stroke="#3A4657" vertical={false} />
                                        <XAxis dataKey="date" hide />
                                        <YAxis tick={{ fontSize: 10, fill: '#8A95A5' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#536175',
                                                border: '3px solid #3A4657',
                                                borderRadius: '0px'
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

