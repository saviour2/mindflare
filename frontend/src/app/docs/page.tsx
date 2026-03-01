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

const DosTerminal = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        const text = typeof children === 'string' ? children : title;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className={cn("dos-terminal", className)}>
            <div className="dos-terminal-bar flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-3 h-3" />
                    <span className="font-pixel text-xs uppercase tracking-widest">{title}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1 border border-current hover:bg-retro-cyan/10 transition-none"
                    title="Copy"
                >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
            </div>
            <div className="p-6 font-code text-sm leading-relaxed overflow-x-auto whitespace-pre text-retro-cyan">
                {children}
            </div>
        </div>
    );
};

const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-retro-panel border-3 border-retro-cyan shadow-pixel-sm flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-retro-cyan" />
        </div>
        <h2 className="font-pixel text-3xl text-retro-white">{title}</h2>
    </div>
);

export default function DocsPage() {
    const [activeTab, setActiveTab] = useState<'cli' | 'sdk' | 'whatsapp'>('cli');

    const tabs = [
        { key: 'cli' as const, label: 'CLI Tool', icon: TerminalIcon },
        { key: 'sdk' as const, label: 'TS / Python SDK', icon: Code },
        { key: 'whatsapp' as const, label: 'WhatsApp Bot', icon: Globe },
    ];

    return (
        <div className="min-h-screen text-retro-white">
            <Navbar />

            {/* Dark backdrop overlay */}
            <div className="fixed inset-0 z-0 bg-[#2F3947]/60 backdrop-blur-[2px] pointer-events-none" />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">

                {/* Hero */}
                <div className="mb-16">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'linear' }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 bg-retro-panel border-3 border-retro-cyan shadow-pixel-sm font-mono text-xs text-retro-cyan">
                            <Zap className="w-3 h-3" /> DEVELOPER DOCUMENTATION
                        </div>
                        <h1 className="font-pixel text-5xl md:text-6xl mb-6 text-retro-white leading-none">
                            Build with <span className="text-retro-cyan">Mindflare</span>
                        </h1>
                        <p className="text-xl text-retro-muted max-w-2xl leading-relaxed font-mono">
                            Integrate world-class RAG-powered AI into your applications in minutes using our professional CLI and TypeScript SDK.
                        </p>
                    </motion.div>
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-wrap gap-0 border-3 border-retro-border w-fit mb-12 shadow-pixel">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 font-pixel text-sm transition-none border-r-3 border-retro-border last:border-r-0",
                                    isActive
                                        ? "bg-retro-cyan text-retro-ink shadow-none"
                                        : "bg-retro-panel text-retro-muted hover:text-retro-white hover:bg-retro-card"
                                )}
                            >
                                <Icon className="w-4 h-4" /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {activeTab === 'cli' ? (
                                <motion.div key="cli" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1, ease: 'linear' }} className="space-y-12">
                                    <section>
                                        <SectionHeader title="CLI Installation" icon={TerminalIcon} />
                                        <p className="text-retro-muted mb-6 font-mono text-sm leading-relaxed">
                                            Our command-line interface allows you to manage applications and knowledge bases directly from your terminal.
                                            Perfect for CI/CD and rapid prototyping.
                                        </p>
                                        <DosTerminal title="bash">
                                            <span className="text-retro-muted"># Install the CLI globally</span>{"\n"}
                                            <span className="text-retro-cyan">npm</span> install -g mindflare-cli{"\n\n"}
                                            <span className="text-retro-muted"># Or run directly with npx</span>{"\n"}
                                            <span className="text-retro-cyan">npx</span> mindflare-cli --help
                                        </DosTerminal>
                                    </section>

                                    <section>
                                        <SectionHeader title="Authentication" icon={Shield} />
                                        <p className="text-retro-muted mb-6 font-mono text-sm leading-relaxed">
                                            Authenticate your session using your CLI Access Token from the Mindflare dashboard (Settings → Developer API).
                                        </p>
                                        <DosTerminal title="mindflare-cli">
                                            mindflare login{"\n"}
                                            <span className="text-retro-muted">? Paste your CLI Token:</span> ******************************{"\n\n"}
                                            <span className="text-green-400">✔ Success! Authenticated as srizdebnath (sriz@mindflare.ai)</span>
                                        </DosTerminal>
                                    </section>

                                    <section>
                                        <SectionHeader title="Core Commands" icon={Layers} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                                <div key={i} className="inventory-slot p-4">
                                                    <code className="text-retro-cyan text-xs font-pixel block mb-2">{item.cmd}</code>
                                                    <p className="text-xs text-retro-muted font-mono">{item.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </motion.div>
                            ) : activeTab === 'sdk' ? (
                                <motion.div key="sdk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1, ease: 'linear' }} className="space-y-12">
                                    <section>
                                        <SectionHeader title="SDK Installation" icon={Blocks} />
                                        <p className="text-retro-muted mb-6 font-mono text-sm leading-relaxed">
                                            The official TypeScript SDK is built for both Node.js and the Browser.
                                            It handles retries, type safety, and conversational state automatically.
                                        </p>
                                        <DosTerminal title="bash">
                                            <span className="text-retro-cyan">npm</span> install mindflare-sdk
                                        </DosTerminal>
                                    </section>

                                    <section>
                                        <SectionHeader title="1-Line UI Integration" icon={Smartphone} />
                                        <p className="text-retro-muted mb-6 font-mono text-sm leading-relaxed">
                                            The fastest way to add a professional chatbot to your website.
                                            Requires standard Client Secret and App API Key.
                                        </p>
                                        <DosTerminal title="index.js">
                                            <span className="text-retro-muted">// Initialize with App ID + Client Secret</span>{"\n"}
                                            <span className="text-[#7B9EC4]">const</span> mf = <span className="text-[#7B9EC4]">new</span> Mindflare({"{"}
                                            {"\n"}&nbsp;&nbsp;email: <span className="text-[#A8D8B0]">"dev@startup.com"</span>,
                                            {"\n"}&nbsp;&nbsp;password: <span className="text-[#A8D8B0]">"••••••••"</span>,
                                            {"\n"}&nbsp;&nbsp;clientSecret: <span className="text-[#A8D8B0]">"mf_sk_••••••••"</span>,
                                            {"\n"}&nbsp;&nbsp;appId: <span className="text-[#A8D8B0]">"mf_app_123"</span>,
                                            {"\n"}&nbsp;&nbsp;apiKey: <span className="text-[#A8D8B0]">"mf_secret_xyz"</span>
                                            {"\n"}{"}"});{"\n\n"}
                                            <span className="text-retro-muted">// Mount to your container</span>{"\n"}
                                            mf.mountChat(<span className="text-[#A8D8B0]">"#chat-widget"</span>);
                                        </DosTerminal>
                                    </section>

                                    <section>
                                        <SectionHeader title="Programmatic Chat" icon={Database} />
                                        <p className="text-retro-muted mb-6 font-mono text-sm leading-relaxed">For building custom UI or backend agents using RAG.</p>
                                        <DosTerminal title="chat.ts">
                                            <span className="text-[#7B9EC4]">const</span> res = <span className="text-[#7B9EC4]">await</span> mf.chat({"{"}
                                            {"\n"}&nbsp;&nbsp;messages: [{"{"}
                                            {"\n"}&nbsp;&nbsp;&nbsp;&nbsp;role: <span className="text-[#A8D8B0]">"user"</span>,
                                            {"\n"}&nbsp;&nbsp;&nbsp;&nbsp;content: <span className="text-[#A8D8B0]">"What's the status of my order?"</span>
                                            {"\n"}&nbsp;&nbsp;{"}"}]
                                            {"\n"}{"}"});{"\n\n"}
                                            <span className="text-retro-muted">// The AI answers based on your Knowledge Base automatically</span>{"\n"}
                                            console.log(res.response);
                                        </DosTerminal>
                                    </section>

                                    <section>
                                        <SectionHeader title="Admin Management" icon={Layers} />
                                        <p className="text-retro-muted mb-6 font-mono text-sm leading-relaxed">Use `MindflareAdmin` for programmatic app and knowledge base management.</p>
                                        <DosTerminal title="admin.ts">
                                            <span className="text-[#7B9EC4]">import</span> {"{"} MindflareAdmin {"}"} <span className="text-[#7B9EC4]">from</span> <span className="text-[#A8D8B0]">"mindflare-sdk"</span>;{"\n\n"}
                                            <span className="text-[#7B9EC4]">const</span> admin = <span className="text-[#7B9EC4]">new</span> MindflareAdmin({"{"} baseUrl: <span className="text-[#A8D8B0]">"https://api.mindflare.ai"</span> {"}"});{"\n\n"}
                                            <span className="text-retro-muted">// Login to get session</span>{"\n"}
                                            <span className="text-[#7B9EC4]">await</span> admin.auth.login({"{"} email: <span className="text-[#A8D8B0]">"..."</span>, password: <span className="text-[#A8D8B0]">"..."</span> {"}"});{"\n\n"}
                                            <span className="text-retro-muted">// Create a KB from website</span>{"\n"}
                                            <span className="text-[#7B9EC4]">const</span> kb = <span className="text-[#7B9EC4]">await</span> admin.knowledgeBases.create({"{"}
                                            {"\n"}&nbsp;&nbsp;kb_name: <span className="text-[#A8D8B0]">"API Docs"</span>,
                                            {"\n"}&nbsp;&nbsp;source_type: <span className="text-[#A8D8B0]">"website"</span>,
                                            {"\n"}&nbsp;&nbsp;source_url: <span className="text-[#A8D8B0]">"https://docs.example.com"</span>
                                            {"\n"}{"}"});
                                        </DosTerminal>
                                    </section>

                                    <section>
                                        <SectionHeader title="Python SDK Support" icon={Blocks} />
                                        <p className="text-retro-muted mb-6 font-mono text-sm leading-relaxed">
                                            Full multi-key strict authentication is also available in our official Python SDK.
                                        </p>
                                        <DosTerminal title="python">
                                            <span className="text-retro-muted">## pip install mindflare-sdk</span>{"\n"}
                                            <span className="text-[#7B9EC4]">from</span> mindflare <span className="text-[#7B9EC4]">import</span> Mindflare{"\n\n"}
                                            mf = Mindflare({"\n"}
                                            &nbsp;&nbsp;email=<span className="text-[#A8D8B0]">"dev@startup.com"</span>,{"\n"}
                                            &nbsp;&nbsp;password=<span className="text-[#A8D8B0]">"••••••••"</span>,{"\n"}
                                            &nbsp;&nbsp;client_secret=<span className="text-[#A8D8B0]">"mf_sk_••••••••"</span>,{"\n"}
                                            &nbsp;&nbsp;app_id=<span className="text-[#A8D8B0]">"mf_app_123"</span>,{"\n"}
                                            &nbsp;&nbsp;api_key=<span className="text-[#A8D8B0]">"mf_secret_xyz"</span>{"\n"}
                                            ){"\n\n"}
                                            reply = mf.ask(<span className="text-[#A8D8B0]">"What is quantum computing?"</span>){"\n"}
                                            print(reply)
                                        </DosTerminal>
                                    </section>
                                </motion.div>
                            ) : (
                                <motion.div key="whatsapp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1, ease: 'linear' }} className="space-y-12">
                                    <section>
                                        <SectionHeader title="WhatsApp Bot Deployment" icon={Globe} />
                                        <p className="text-retro-muted mb-6 font-mono text-sm leading-relaxed">
                                            Deploy your AI assistant directly to WhatsApp with 1 command.
                                            Your bot will answer DMs using your Knowledge Base in real-time.
                                        </p>
                                        <DosTerminal title="terminal">
                                            <span className="text-retro-muted">## Deploy app to WhatsApp</span>{"\n"}
                                            <span className="text-retro-cyan">mindflare</span> whatsapp{"\n\n"}
                                            <span className="text-retro-muted">? Which application do you want to run?</span> My Chatbot{"\n"}
                                            <span className="text-green-400">⠋ Initializing WhatsApp connection...</span>{"\n\n"}
                                            <span className="text-retro-muted">## QR code will appear below — scan it with WhatsApp</span>
                                        </DosTerminal>
                                    </section>
                                    <section>
                                        <SectionHeader title="How it Works" icon={Blocks} />
                                        <div className="space-y-3">
                                            {[
                                                { title: 'Scan & Link', desc: 'Scan the generated QR code in your terminal with WhatsApp (Linked Devices) to authorize the bot session.' },
                                                { title: 'Background Loop', desc: 'The CLI maintains a secure WebSocket connection to WhatsApp. It listens for incoming DMs and processes them.' },
                                                { title: 'Smart RAG Context', desc: 'Incoming messages are automatically queried against your Mindflare Knowledge Base to provide grounded answers.' },
                                                { title: 'Conversation State', desc: 'The bot remembers the last 40 turns of the conversation for each user, ensuring natural multi-turn dialogue.' }
                                            ].map((step, i) => (
                                                <div key={i} className="flex gap-4 p-4 bg-retro-panel border-3 border-retro-border shadow-pixel-sm">
                                                    <div className="w-8 h-8 bg-retro-cyan text-retro-ink flex items-center justify-center font-pixel text-sm flex-shrink-0">{i + 1}</div>
                                                    <div>
                                                        <h4 className="font-pixel text-sm text-retro-cyan mb-1">{step.title}</h4>
                                                        <p className="text-sm text-retro-muted font-mono leading-relaxed">{step.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-36 h-fit space-y-6">
                        <div className="bg-retro-panel border-3 border-retro-border shadow-pixel p-6">
                            <h3 className="font-pixel text-lg text-retro-white mb-4 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-retro-cyan" /> Resources
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    { label: 'GitHub Repository', href: 'https://github.com/Srizdebnath/mindflare.ai' },
                                    { label: 'NPM: mindflare-sdk', href: 'https://www.npmjs.com/package/mindflare-sdk' },
                                    { label: 'NPM: mindflare-cli', href: 'https://www.npmjs.com/package/mindflare-cli' },
                                    { label: 'API Reference', href: '#' }
                                ].map((link, i) => (
                                    <li key={i}>
                                        <a href={link.href} className="font-mono text-sm text-retro-muted hover:text-retro-cyan flex items-center justify-between group transition-none">
                                            {link.label}
                                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-none" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-retro-panel border-3 border-retro-cyan shadow-pixel-cyan p-6">
                            <h3 className="font-pixel text-lg text-retro-white mb-2">Need help?</h3>
                            <p className="font-mono text-sm text-retro-muted mb-4 leading-relaxed">Our developer success team is here to help you scale your AI infra.</p>
                            <button className="w-full py-2.5 bg-retro-cyan text-retro-ink border-3 border-retro-cyan-dark shadow-pixel-sm font-pixel text-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-none active:translate-x-[4px] active:translate-y-[4px]">
                                Join Developer Discord
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
