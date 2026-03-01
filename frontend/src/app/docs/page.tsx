"use client";

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal as TerminalIcon,
    Code,
    Book,
    Cpu,
    Zap,
    Shield,
    Layers,
    Copy,
    Check,
    ChevronRight,
    Database,
    Blocks,
    Smartphone,
    Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TerminalWindow = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        // Collect all text from children
        const text = title === "bash" ? "npm install -g mindflare-cli" : "mindflare login"; // Simple fallback for copy
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn("rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden shadow-2xl backdrop-blur-md", className)}>
            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{title}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-white/5 rounded transition-colors text-zinc-500 hover:text-white"
                >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre text-zinc-300">
                {children}
            </div>
        </div>
    );
};

const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-base/10 border border-blue-base/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-base" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white">{title}</h2>
    </div>
);

export default function DocsPage() {
    const [activeTab, setActiveTab] = useState<'cli' | 'sdk' | 'whatsapp'>('cli');

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-base/30">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
                {/* Hero Section */}
                <div className="mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-base/10 border border-blue-base/20 text-blue-base text-xs font-bold uppercase tracking-widest mb-6">
                            <Zap className="w-3 h-3" /> Developer Documentation
                        </div>
                        <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
                            Build with <span className="bg-gradient-to-r from-blue-base to-blue-light bg-clip-text text-transparent italic">Mindflare</span>
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                            Integrate world-class RAG-powered AI into your applications in minutes using our professional CLI and TypeScript SDK.
                        </p>
                    </motion.div>
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-wrap gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-fit mb-12">
                    <button
                        onClick={() => setActiveTab('cli')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            activeTab === 'cli' ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"
                        )}
                    >
                        <TerminalIcon className="w-4 h-4" /> CLI Tool
                    </button>
                    <button
                        onClick={() => setActiveTab('sdk')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            activeTab === 'sdk' ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"
                        )}
                    >
                        <Code className="w-4 h-4" /> TS / Python SDK
                    </button>
                    <button
                        onClick={() => setActiveTab('whatsapp')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            activeTab === 'whatsapp' ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"
                        )}
                    >
                        <Globe className="w-4 h-4" /> WhatsApp Bot
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {activeTab === 'cli' ? (
                                <motion.div
                                    key="cli"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-12"
                                >
                                    <section>
                                        <SectionHeader title="CLI Installation" icon={TerminalIcon} />
                                        <p className="text-zinc-400 mb-6 font-sans">
                                            Our command-line interface allows you to manage applications and knowledge bases directly from your terminal.
                                            Perfect for CI/CD and rapid prototyping.
                                        </p>
                                        <TerminalWindow title="bash">
                                            <span className="text-zinc-500"># Install the CLI globally</span><br />
                                            <span className="text-blue-base">npm</span> install -g mindflare-cli<br /><br />
                                            <span className="text-zinc-500"># Or run directly with npx</span><br />
                                            <span className="text-blue-base">npx</span> mindflare-cli --help
                                        </TerminalWindow>
                                    </section>

                                    <section>
                                        <SectionHeader title="Authentication" icon={Shield} />
                                        <p className="text-zinc-400 mb-6 font-sans">
                                            Authenticate your session using your CLI Access Token from the Mindflare dashboard (Settings {'->'} Developer API).
                                        </p>
                                        <TerminalWindow title="mindflare-cli">
                                            mindflare login<br />
                                            <span className="text-zinc-500">? Paste your CLI Token:</span> ******************************<br /><br />
                                            <span className="text-emerald-400">✔ Success! Authenticated as srizdebnath (sriz@mindflare.ai)</span>
                                        </TerminalWindow>
                                    </section>

                                    <section>
                                        <SectionHeader title="Core Commands" icon={Layers} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { cmd: 'mindflare apps create -n "My App"', desc: 'Create a new AI application' },
                                                { cmd: 'mindflare apps list', desc: 'View all your AI applications' },
                                                { cmd: 'mindflare apps use <appId>', desc: 'Set default app for future commands' },
                                                { cmd: 'mindflare kb list', desc: 'List all knowledge bases' },
                                                { cmd: 'mindflare kb create -n "Docs" -t website -u URL', desc: 'Ingest a source' },
                                                { cmd: 'mindflare kb status <kbId> --wait', desc: 'Watch ingestion progress' },
                                                { cmd: 'mindflare chat', desc: 'Start interactive RAG chat session' },
                                                { cmd: 'mindflare chat -m "hi"', desc: 'Single-shot message mode' },
                                                { cmd: 'mindflare config', desc: 'View/update CLI configuration' },
                                                { cmd: 'mindflare whoami', desc: 'Check active session status' }
                                            ].map((item, i) => (
                                                <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                                                    <code className="text-blue-base text-xs font-bold block mb-2">{item.cmd}</code>
                                                    <p className="text-xs text-zinc-500">{item.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </motion.div>
                            ) : activeTab === 'sdk' ? (
                                <motion.div
                                    key="sdk"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-12"
                                >
                                    <section>
                                        <SectionHeader title="SDK Installation" icon={Blocks} />
                                        <p className="text-zinc-400 mb-6 font-sans">
                                            The official TypeScript SDK is built for both Node.js and the Browser.
                                            It handles retries, type safety, and conversational state automatically.
                                        </p>
                                        <TerminalWindow title="bash">
                                            <span className="text-blue-base">npm</span> install mindflare-sdk
                                        </TerminalWindow>
                                    </section>

                                    <section>
                                        <SectionHeader title="1-Line UI Integration" icon={Smartphone} />
                                        <p className="text-zinc-400 mb-6 font-sans">
                                            The fastest way to add a professional chatbot to your website.
                                            Requires standard Client Secret and App API Key.
                                        </p>
                                        <TerminalWindow title="index.js">
                                            <span className="text-zinc-500">// Initialize with App ID + Client Secret</span><br />
                                            <span className="text-blue-400">const</span> mf = <span className="text-blue-400">new</span> Mindflare({"{"}<br />
                                            &nbsp;&nbsp;email: <span className="text-emerald-400">"dev@startup.com"</span>,<br />
                                            &nbsp;&nbsp;password: <span className="text-emerald-400">"••••••••"</span>,<br />
                                            &nbsp;&nbsp;clientSecret: <span className="text-emerald-400">"mf_sk_••••••••"</span>,<br />
                                            &nbsp;&nbsp;appId: <span className="text-emerald-400">"mf_app_123"</span>,<br />
                                            &nbsp;&nbsp;apiKey: <span className="text-emerald-400">"mf_secret_xyz"</span><br />
                                            {"}"});<br /><br />
                                            <span className="text-zinc-500">// Mount to your container</span><br />
                                            mf.mountChat(<span className="text-emerald-400">"#chat-widget"</span>);
                                        </TerminalWindow>
                                    </section>

                                    <section>
                                        <SectionHeader title="Programmatic Chat" icon={Database} />
                                        <p className="text-zinc-400 mb-6 font-sans">For building custom UI or backend agents using RAG.</p>
                                        <TerminalWindow title="chat.ts">
                                            <span className="text-blue-400">const</span> res = <span className="text-blue-400">await</span> mf.chat({"{"}<br />
                                            &nbsp;&nbsp;messages: [{"{"}<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;role: <span className="text-emerald-400">"user"</span>, <br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;content: <span className="text-emerald-400">"What's the status of my order?"</span> <br />
                                            &nbsp;&nbsp;{"}"}]<br />
                                            {"}"});<br /><br />
                                            <span className="text-zinc-500">// The AI answers based on your Knowledge Base automatically</span><br />
                                            console.log(res.response);
                                        </TerminalWindow>
                                    </section>

                                    <section>
                                        <SectionHeader title="Admin Management" icon={Layers} />
                                        <p className="text-zinc-400 mb-6 font-sans">Use `MindflareAdmin` for programmatic app and knowledge base management.</p>
                                        <TerminalWindow title="admin.ts">
                                            <span className="text-blue-400">import</span> {"{"} MindflareAdmin {"}"} <span className="text-blue-400">from</span> <span className="text-emerald-400">"mindflare-sdk"</span>;<br /><br />
                                            <span className="text-blue-400">const</span> admin = <span className="text-blue-400">new</span> MindflareAdmin({"{"} baseUrl: <span className="text-emerald-400">"https://api.mindflare.ai"</span> {"}"});<br /><br />
                                            <span className="text-zinc-500">// Login to get session</span><br />
                                            <span className="text-blue-400">await</span> admin.auth.login({"{"} email: <span className="text-emerald-400">"..."</span>, password: <span className="text-emerald-400">"..."</span> {"}"});<br /><br />
                                            <span className="text-zinc-500">// Create a KB from website</span><br />
                                            <span className="text-blue-400">const</span> kb = <span className="text-blue-400">await</span> admin.knowledgeBases.create({"{"}<br />
                                            &nbsp;&nbsp;kb_name: <span className="text-emerald-400">"API Docs"</span>,<br />
                                            &nbsp;&nbsp;source_type: <span className="text-emerald-400">"website"</span>,<br />
                                            &nbsp;&nbsp;source_url: <span className="text-emerald-400">"https://docs.example.com"</span><br />
                                            {"}"});
                                        </TerminalWindow>
                                    </section>

                                    <section>
                                        <SectionHeader title="Python SDK Support" icon={Blocks} />
                                        <p className="text-zinc-400 mb-6 font-sans">
                                            Full multi-key strict authentication is also available in our official Python SDK.
                                        </p>
                                        <TerminalWindow title="python">
                                            <span className="text-zinc-500">## pip install mindflare-sdk</span><br />
                                            <span className="text-blue-400">from</span> mindflare <span className="text-blue-400">import</span> Mindflare<br /><br />
                                            mf = Mindflare(<br />
                                            &nbsp;&nbsp;email=<span className="text-emerald-400">"dev@startup.com"</span>,<br />
                                            &nbsp;&nbsp;password=<span className="text-emerald-400">"••••••••"</span>,<br />
                                            &nbsp;&nbsp;client_secret=<span className="text-emerald-400">"mf_sk_••••••••"</span>,<br />
                                            &nbsp;&nbsp;app_id=<span className="text-emerald-400">"mf_app_123"</span>,<br />
                                            &nbsp;&nbsp;api_key=<span className="text-emerald-400">"mf_secret_xyz"</span><br />
                                            )<br /><br />
                                            reply = mf.ask(<span className="text-emerald-400">"What is quantum computing?"</span>)<br />
                                            print(reply)
                                        </TerminalWindow>
                                    </section>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="whatsapp"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-12"
                                >
                                    <section>
                                        <SectionHeader title="WhatsApp Bot Deployment" icon={Globe} />
                                        <p className="text-zinc-400 mb-6 font-sans">
                                            Deploy your AI assistant directly to WhatsApp with 1 command.
                                            Your bot will answer DMs using your Knowledge Base in real-time.
                                        </p>
                                        <TerminalWindow title="terminal">
                                            <span className="text-zinc-500">## Deploy app to WhatsApp</span><br />
                                            <span className="text-blue-base">mindflare</span> whatsapp<br /><br />
                                            <span className="text-zinc-400">? Which application do you want to run?</span> My Chatbot<br />
                                            <span className="text-emerald-400">⠋ Initializing WhatsApp connection...</span><br /><br />
                                            <span className="text-zinc-500">## QR code will appear below — scan it with WhatsApp</span>
                                        </TerminalWindow>
                                    </section>
                                    <section>
                                        <SectionHeader title="How it Works" icon={Blocks} />
                                        <div className="space-y-4">
                                            {[
                                                { title: 'Scan & Link', desc: 'Scan the generated QR code in your terminal with WhatsApp (Linked Devices) to authorize the bot session.' },
                                                { title: 'Background Loop', desc: 'The CLI maintains a secure WebSocket connection to WhatsApp. It listens for incoming DMs and processes them.' },
                                                { title: 'Smart RAG Context', desc: 'Incoming messages are automatically queried against your Mindflare Knowledge Base to provide grounded answers.' },
                                                { title: 'Conversation State', desc: 'The bot remembers the last 40 turns of the conversation for each user, ensuring natural multi-turn dialogue.' }
                                            ].map((step, i) => (
                                                <div key={i} className="flex gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                                    <div className="w-8 h-8 rounded-full bg-blue-base/10 flex items-center justify-center text-blue-base text-xs font-bold shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
                                                        <p className="text-sm text-zinc-500">{step.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar / Quick Links */}
                    <div className="lg:col-span-4 lg:sticky lg:top-36 h-fit space-y-8">
                        <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-400" /> Resources
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { label: 'GitHub Repository', href: 'https://github.com/Srizdebnath/mindflare.ai' },
                                    { label: 'NPM: mindflare-sdk', href: 'https://www.npmjs.com/package/mindflare-sdk' },
                                    { label: 'NPM: mindflare-cli', href: 'https://www.npmjs.com/package/mindflare-cli' },
                                    { label: 'API Reference', href: '#' }
                                ].map((link, i) => (
                                    <li key={i}>
                                        <a href={link.href} className="text-sm text-zinc-400 hover:text-white flex items-center justify-between group">
                                            {link.label}
                                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-6 rounded-2xl border border-blue-base/20 bg-blue-base/[0.02]">
                            <h3 className="text-lg font-bold mb-2">Need help?</h3>
                            <p className="text-sm text-zinc-500 mb-4">Our developer success team is here to help you scale your AI infra.</p>
                            <button className="w-full py-2.5 rounded-xl bg-blue-base text-black font-bold text-sm tracking-tight hover:scale-105 transition-transform">
                                Join Developer Discord
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Background Decor */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-base/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-[120px]" />
            </div>
        </div>
    );
}
