"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Blocks, Share2, LineChart, Cpu, Zap } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';

const RetroWindow = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("border-3 border-retro-border shadow-pixel-lg bg-retro-panel overflow-hidden", className)}>
    <div className="bg-retro-card border-b-3 border-retro-border px-3 py-2 flex items-center justify-between relative">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 bg-[#D88A8A] border border-[#B06060] inline-block" />
        <span className="w-3 h-3 bg-[#D8C4A8] border border-[#B0A080] inline-block" />
        <span className="w-3 h-3 bg-[#A8D8B0] border border-[#78B080] inline-block" />
      </div>
      <span className="font-pixel text-sm text-retro-white absolute left-1/2 -translate-x-1/2">{title}</span>
      <span className="w-3 h-3 bg-retro-border inline-block" />
    </div>
    {children}
  </div>
);

const PixelConveyorBelt = () => {
  const items = [
    { label: "PDF", bg: "bg-[#6A7B94]", char: "📄" },
    { label: "WEB", bg: "bg-[#7B6A94]", char: "🌐" },
    { label: "GITHUB", bg: "bg-[#5A6B7A]", char: "⚙" },
    { label: "CHUNK", bg: "bg-retro-card", char: "▪" },
    { label: "EMBED", bg: "bg-[#5A7A6A]", char: "⚡" },
    { label: "FAISS", bg: "bg-retro-panel", char: "🗄" },
  ];
  return (
    <div className="w-full overflow-hidden border-3 border-retro-border bg-retro-card">
      <div className="flex animate-conveyor" style={{ width: "200%" }}>
        {[...items, ...items].map((s, i) => (
          <div key={i} className={cn("flex-shrink-0 w-20 h-16 border-r-3 border-retro-border flex flex-col items-center justify-center gap-1", s.bg)}>
            <span className="text-lg leading-none">{s.char}</span>
            <span className="font-pixel text-[9px] text-retro-white">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="h-2 bg-retro-border border-t-3 border-retro-border" />
    </div>
  );
};

const SpeechBubble = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("speech-bubble", className)}>{children}</div>
);

const RetroDeployIndicators = () => {
  const platforms = [
    { name: "Web Client", status: "LIVE" },
    { name: "Node.js SDK", status: "LIVE" },
    { name: "WhatsApp", status: "BETA" },
    { name: "Telegram", status: "BETA" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {platforms.map((p, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-2 bg-retro-card border-3 border-retro-border shadow-pixel-sm font-mono text-sm">
          <span className="text-retro-white">{p.name}</span>
          <div className="flex items-center gap-2">
            <span className={cn("font-pixel text-sm", p.status === "LIVE" ? "text-retro-cyan" : "text-retro-dim")}>{p.status}</span>
            <span className={cn("w-2 h-2 border border-current", p.status === "LIVE" ? "bg-retro-cyan border-retro-cyan-dark animate-pixel-blink" : "bg-retro-dim border-retro-border")} />
          </div>
        </div>
      ))}
    </div>
  );
};

const CheckIcon = () => <span className="font-pixel text-retro-cyan text-lg leading-none flex-shrink-0">&gt;</span>;

export default function Home() {
  const WORDS = ["Chatbots", "Agents", "Pipelines"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const { user, login } = useAuth();
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ["start center", "end center"] });

  useEffect(() => {
    const interval = setInterval(() => setCurrentWordIndex((prev) => (prev + 1) % WORDS.length), 2500);
    return () => clearInterval(interval);
  }, [WORDS.length]);

  const features = [
    {
      title: "Knowledge Bases",
      description: "Upload documents, crawl websites, or sync with GitHub to ground your AI in your own data.",
      icon: BookOpen,
      visual: (
        <RetroWindow title="index_workspace.exe" className="h-full">
          <div className="p-4 font-mono text-sm text-retro-cyan">
            <div className="mb-3 text-retro-muted text-xs">{"C:\\MINDFLARE> list sources"}</div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-2">
                {["docs/", "src/", "README.md"].map((item, i) => (
                  <div key={i} className="px-3 py-1.5 bg-retro-card border-3 border-retro-border text-retro-white text-xs flex items-center gap-2 shadow-pixel-sm">
                    <span className="text-retro-cyan">▸</span> {item}
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-px h-8 bg-retro-border" />
                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="font-pixel text-retro-cyan text-xs">→→</motion.span>
                <div className="w-px h-8 bg-retro-border" />
              </div>
              <div className="w-16 h-16 bg-retro-card border-3 border-retro-cyan shadow-pixel-cyan flex items-center justify-center">
                <Cpu className="text-retro-cyan w-8 h-8" />
              </div>
            </div>
            <div className="mt-3 text-xs text-retro-muted animate-pixel-blink">█</div>
          </div>
        </RetroWindow>
      ),
    },
    {
      title: "SDK Integration",
      description: "Connect your application with our powerful JS SDK in just a few lines of code.",
      icon: Blocks,
      visual: (
        <RetroWindow title="mindflare.js — EDITOR" className="h-full">
          <div className="p-4 font-code text-sm text-retro-cyan leading-relaxed">
            <span className="text-[#7B9EC4]">import</span> Mindflare <span className="text-[#7B9EC4]">from</span> <span className="text-[#A8D8B0]">&apos;mindflare-sdk&apos;</span>;<br /><br />
            <span className="text-[#7B9EC4]">const</span> mf = <span className="text-[#7B9EC4]">new</span> Mindflare(<span className="text-[#A8D8B0]">&apos;YOUR_API_KEY&apos;</span>);<br /><br />
            <span className="text-retro-muted">{"// Connect to your knowledge base"}</span><br />
            <span className="text-[#7B9EC4]">const</span> response = <span className="text-[#7B9EC4]">await</span> mf.chat(<span className="text-[#A8D8B0]">&quot;What is RAG?&quot;</span>);<br /><br />
            console.log(response.response);
          </div>
        </RetroWindow>
      ),
    },
    {
      title: "Multi-channel",
      description: "Deploy your AI models across WhatsApp, Telegram, or any custom platform using our robust backend.",
      icon: Share2,
      visual: (
        <RetroWindow title="webhook_endpoints.sys" className="h-full">
          <div className="p-4 flex flex-col gap-2">
            <div className="text-xs font-mono text-retro-muted mb-2">{"[WEBHOOK REGISTRY]"}</div>
            {["WhatsApp (Prod)", "Slack (Internal)", "Telegram (Beta)"].map((channel, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-retro-card border-3 border-retro-border shadow-pixel-sm font-mono text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-retro-cyan" />
                  <span className="text-retro-white text-xs">{channel}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-retro-cyan text-xs font-pixel">OK</span>
                  <span className="text-retro-muted text-[10px]">~120ms</span>
                </div>
              </div>
            ))}
          </div>
        </RetroWindow>
      ),
    },
    {
      title: "Analytics",
      description: "Track usage, monitor costs, and gain insights into how users interact with your AI apps.",
      icon: LineChart,
      visual: (
        <RetroWindow title="analytics.dat" className="h-full">
          <div className="p-4 flex flex-col h-full">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-retro-card border-3 border-retro-border p-3">
                <div className="font-pixel text-[10px] text-retro-muted mb-1">TOKENS</div>
                <div className="font-pixel text-3xl text-retro-cyan">1.2M</div>
              </div>
              <div className="bg-retro-card border-3 border-retro-border p-3">
                <div className="font-pixel text-[10px] text-retro-muted mb-1">LATENCY</div>
                <div className="font-pixel text-3xl text-retro-cyan">0.8s</div>
              </div>
            </div>
            <div className="flex items-end gap-1 h-24 border-3 border-retro-border bg-retro-card p-2">
              {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ type: "tween", ease: "linear", duration: 0.5, delay: i * 0.08 }} className={`flex-1 ${i === 5 ? "bg-retro-cyan" : "bg-retro-border"}`} />
              ))}
            </div>
          </div>
        </RetroWindow>
      ),
    },
  ];

  return (
    <div className="min-h-screen text-retro-white flex flex-col overflow-hidden">
      <Navbar />
      {/* Subtle pixel grid overlay (very faint over bg image) */}
      <div className="fixed inset-0 z-0 bg-pixel-grid pointer-events-none" style={{ backgroundSize: "32px 32px" }} />

      <main className="flex-1 relative z-10 pt-16">
        {/* HERO */}
        <section className="w-full min-h-screen flex items-center relative">
          <div className="w-full max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {/* Left: Text Panel */}
            <div className="w-full lg:w-1/2 flex flex-col items-start justify-center text-left bg-[#536175]/70 backdrop-blur-sm p-8 lg:p-12 border-3 border-retro-border shadow-pixel-lg">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "linear" }} className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 bg-retro-panel border-3 border-retro-cyan shadow-pixel-sm font-mono text-xs text-retro-cyan">
                <span className="animate-pixel-blink">▌</span>
                <span>Mindflare RAG v2 is live</span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "linear", delay: 0.1 }} className="font-pixel text-5xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-8xl leading-none tracking-wide mb-6 text-retro-white" style={{ textShadow: '3px 3px 0px #2F3947' }}>
                Build Intelligent
                <br />
                <span className="inline-flex overflow-hidden h-[1.1em] relative align-top w-full">
                  <AnimatePresence mode="popLayout">
                    <motion.span key={currentWordIndex} initial={{ y: "100%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ type: "tween", ease: "linear", duration: 0.15 }} className="absolute left-0 text-retro-cyan whitespace-nowrap">
                      {WORDS[currentWordIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <br />
                With Elegance.
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "linear", delay: 0.2 }} className="text-lg text-retro-muted max-w-xl mb-10 leading-relaxed font-mono">
                Abstract away the complexity of retrieval augmented generation and model orchestrations into a single, seamless platform.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "linear", delay: 0.3 }} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                {user ? (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button size="lg" className="relative w-full sm:w-auto font-pixel text-xl">Go to Dashboard</Button>
                  </Link>
                ) : (
                  <Button onClick={login} size="lg" className="relative w-full sm:w-auto font-pixel text-xl">Start Building For Free</Button>
                )}
                <Link href="#features" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto font-pixel text-lg">
                    Explore Features <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right: Terminal */}
            <motion.div className="w-full lg:w-1/2 flex items-center justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "linear", delay: 0.3 }}>
              <RetroWindow title="MINDFLARE — TERMINAL v2.0" className="w-full">
                <div className="p-5 font-code text-sm leading-[1.9] text-retro-cyan h-[400px] lg:h-[480px] overflow-hidden scanline-overlay">
                  <div><span className="text-retro-muted">C:\MINDFLARE&gt;</span> Initialize SDK</div>
                  <div className="text-retro-muted pl-4 border-l-3 border-retro-border my-2">
                    <span className="text-retro-white">Created connection pool.</span><br />
                    <span className="text-retro-cyan">✓ Environment secured.</span>
                  </div>
                  <div><span className="text-retro-muted">C:\MINDFLARE&gt;</span> const engine = new Mindflare()</div>
                  <div className="text-retro-muted pl-4 border-l-3 border-retro-border my-2">
                    Embedding documents... <span className="text-retro-cyan">[██████████] 100%</span><br />
                    Routing models initiated.<br />
                    <span className="text-retro-cyan">✓ Memory synced.</span>
                  </div>
                  <div><span className="text-retro-muted">C:\MINDFLARE&gt;</span> engine.chat(&quot;Explain RAG&quot;)</div>
                  <div className="text-retro-muted pl-4 border-l-3 border-retro-border my-2">
                    <span className="text-retro-white">RAG (Retrieval Augmented Generation)</span><br />
                    <span className="text-retro-white">is the process of grounding LLMs in</span><br />
                    <span className="text-retro-white">external knowledge via vector search...</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-retro-muted">C:\MINDFLARE&gt;</span>
                    <span className="animate-pixel-blink text-retro-cyan font-pixel text-lg">█</span>
                  </div>
                </div>
                <div className="bg-retro-cyan text-retro-ink font-mono text-xs px-4 py-1 flex justify-between">
                  <span>READY</span><span>MODEL: llama-3.1-8b</span><span>KB: ACTIVE</span>
                </div>
              </RetroWindow>
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="w-full py-24 lg:py-32 relative overflow-hidden" ref={timelineRef}>
          <div className="absolute inset-0 bg-[#536175]/60 backdrop-blur-[2px]" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-20 relative z-10">
              <h2 className="font-pixel text-5xl md:text-6xl text-retro-white mb-4 leading-none" style={{ textShadow: '3px 3px 0px #2F3947' }}>HOW IT WORKS</h2>
              <p className="text-retro-muted font-mono max-w-xl mx-auto text-base leading-relaxed">From raw data to multi-channel deployment in minutes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
              <div className="hidden md:block absolute top-[80px] left-[33%] right-[33%] h-1 bg-retro-border z-0" />
              {[
                {
                  step: "01", title: "Ingest",
                  desc: "Point Mindflare at your data—GitHub, Website, or local PDFs. We handle chunking and embedding.",
                  visual: <PixelConveyorBelt />,
                  bubble: "Feed your knowledge in →"
                },
                {
                  step: "02", title: "Connect",
                  desc: "Drop our SDK into your codebase. Three lines of code to replace your entire orchestration backend.",
                  visual: (
                    <RetroWindow title="app.js">
                      <div className="p-3 font-code text-xs text-retro-cyan leading-loose">
                        <span className="text-[#7B9EC4]">import</span> Mindflare <span className="text-[#7B9EC4]">from</span> <span className="text-[#A8D8B0]">&apos;mindflare-sdk&apos;</span>;<br />
                        <span className="text-[#7B9EC4]">const</span> mf = <span className="text-[#7B9EC4]">new</span> Mindflare();<br />
                        <span className="text-[#7B9EC4]">await</span> mf.chat(<span className="text-[#A8D8B0]">&apos;...&apos;</span>);
                      </div>
                    </RetroWindow>
                  ),
                  bubble: "3 lines. That is all."
                },
                {
                  step: "03", title: "Deploy",
                  desc: "Go live across web, WhatsApp, and Telegram instantly. Monitored and production-ready.",
                  visual: <RetroDeployIndicators />,
                  bubble: "→ Ship everywhere!"
                },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.2, ease: "linear", delay: i * 0.1 }} className="relative z-10 flex flex-col items-center text-center px-4">
                  <div className="font-pixel text-4xl text-retro-cyan bg-retro-card border-3 border-retro-cyan shadow-pixel-cyan w-16 h-16 flex items-center justify-center mb-4">{item.step}</div>
                  <h3 className="font-pixel text-2xl text-retro-white mb-3">{item.title}</h3>
                  <SpeechBubble className="mb-4 w-full"><p className="font-pixel text-sm text-retro-cyan">{item.bubble}</p></SpeechBubble>
                  <div className="w-full mb-4 min-h-[120px]">{item.visual}</div>
                  <p className="text-retro-muted font-mono text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="container mx-auto px-6 py-24 mb-8 relative">
          <div className="absolute inset-0 -mx-6 bg-[#536175]/50 backdrop-blur-[2px]" />
          <div className="mb-16 text-left max-w-4xl relative z-10">
            <h2 className="font-pixel text-5xl md:text-6xl text-retro-white leading-none mb-4" style={{ textShadow: '3px 3px 0px #2F3947' }}>
              EVERYTHING YOU NEED<br /><span className="text-retro-cyan">FOR AI.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
            <div className="lg:col-span-4 flex flex-col gap-2">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                const isActive = activeFeature === idx;
                return (
                  <motion.button key={idx} onClick={() => setActiveFeature(idx)}
                    className={cn("text-left p-4 border-3 transition-none relative", isActive ? "bg-retro-card border-retro-cyan shadow-pixel-cyan" : "bg-retro-panel border-retro-border shadow-pixel hover:border-retro-muted")}
                    whileTap={{ x: 2, y: 2 }}>
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-retro-cyan" />}
                    <div className="flex items-center gap-4 mb-2 pl-2">
                      <div className={cn("w-10 h-10 border-3 flex items-center justify-center transition-none", isActive ? "bg-retro-panel border-retro-cyan text-retro-cyan" : "bg-retro-card border-retro-border text-retro-muted")}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className={cn("font-pixel text-lg transition-none", isActive ? "text-retro-cyan" : "text-retro-muted")}>{feature.title}</h3>
                    </div>
                    <p className={cn("font-mono text-xs leading-relaxed pl-2", isActive ? "text-retro-white" : "text-retro-dim")}>{feature.description}</p>
                  </motion.button>
                );
              })}
            </div>
            <div className="lg:col-span-8 relative min-h-[400px] flex items-center">
              <div className="w-full h-full border-3 border-retro-border shadow-pixel-lg bg-retro-panel overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div key={activeFeature} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1, ease: "linear" }} className="w-full h-full p-6 min-h-[400px]">
                    {features[activeFeature].visual}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="w-full py-16 mb-8 relative">
          <div className="absolute inset-0 bg-[#536175]/50 backdrop-blur-[2px]" />
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-stretch">
              <div className="lg:col-span-2 bg-retro-panel border-3 border-retro-border shadow-pixel-lg p-8 flex flex-col">
                <div className="bg-retro-border px-3 py-1 mb-4 w-fit"><span className="font-pixel text-sm text-retro-white">FOR DEVELOPERS</span></div>
                <h3 className="font-pixel text-4xl text-retro-white mb-2">The Platform</h3>
                <p className="font-mono text-xs text-retro-muted mb-6">Open access. No credit card.</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["Full SDK & CLI", "Unlimited Apps", "Self-serve KBs", "Realtime Analytics"].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 font-mono text-sm text-retro-white"><CheckIcon /> {f}</li>
                  ))}
                </ul>
                <Button onClick={login} className="w-full font-pixel text-xl">Start Building</Button>
              </div>
              <div className="lg:col-span-3 bg-retro-card border-3 border-retro-cyan shadow-pixel-cyan p-10 relative overflow-hidden flex flex-col">
                <div className="bg-retro-cyan px-3 py-1 mb-4 w-fit"><span className="font-pixel text-sm text-retro-ink">ENTERPRISE</span></div>
                <div className="absolute top-0 right-0 opacity-5"><Cpu className="w-40 h-40 text-retro-cyan" /></div>
                <h3 className="font-pixel text-5xl text-retro-white mb-4">White-Glove</h3>
                <p className="text-retro-cyan font-mono text-base mb-8 max-w-sm">We build and manage your custom AI agents for you.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  <ul className="space-y-3">{["Custom Engineering", "Managed Pipeline"].map(f => (<li key={f} className="flex gap-3 font-mono text-sm text-retro-white"><CheckIcon /> {f}</li>))}</ul>
                  <ul className="space-y-3">{["24/7 Priority Support", "Dedicated Success"].map(f => (<li key={f} className="flex gap-3 font-mono text-sm text-retro-white"><CheckIcon /> {f}</li>))}</ul>
                </div>
                <Button className="w-full sm:w-auto font-pixel text-xl bg-retro-cyan text-retro-ink border-retro-cyan-dark shadow-pixel-cyan">Book Consultation</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-3 border-retro-border py-10 px-6 bg-retro-panel">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-retro-cyan border-3 border-retro-cyan-dark flex items-center justify-center">
              <span className="font-pixel text-retro-ink text-sm">M</span>
            </div>
            <span className="font-pixel text-xl text-retro-white">MindflareAI</span>
          </div>
          <p className="font-mono text-xs text-retro-muted">© 2026 MindflareAI. Engineering excellence in AI orchestration.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="font-mono text-xs text-retro-muted hover:text-retro-cyan transition-none">Terms</Link>
            <Link href="#" className="font-mono text-xs text-retro-muted hover:text-retro-cyan transition-none">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
