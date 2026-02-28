"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Blocks, Share2, LineChart, Terminal, Cpu, Zap, Bot, Database, Code, Shield } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';

const DocumentToParticles = () => {
  return (
    <div className="relative w-full h-full min-h-[150px] flex items-center justify-center">
      <motion.div
        animate={{ x: -20, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeIn" }}
        className="w-16 h-20 bg-white/5 border border-white/20 rounded-md shadow-sm flex flex-col justify-center gap-2 p-3 absolute z-10"
      >
        <div className="w-3/4 h-1 bg-gold-light/40 rounded" />
        <div className="w-full h-1 bg-gold-light/40 rounded" />
        <div className="w-5/6 h-1 bg-gold-light/40 rounded" />
      </motion.div>
      <div className="absolute w-24 h-24 flex flex-wrap gap-1 items-center justify-center ml-12">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0, x: -10, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 60 + 20],
              y: [0, (Math.random() - 0.5) * 60]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: Math.random() * 2 }}
            className="w-1.5 h-1.5 rounded-full bg-gold-light shadow-[0_0_8px_rgba(212,175,55,0.8)] absolute"
          />
        ))}
      </div>
    </div>
  );
};

const DeployStatusIndicators = () => {
  const platforms = [
    { name: 'Web Client', status: 'LIVE' },
    { name: 'Node.js SDK', status: 'LIVE' },
    { name: 'WhatsApp', status: 'BETA' },
    { name: 'Telegram', status: 'BETA' },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-3 justify-center">
      {platforms.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: i * 0.2 }}
          className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
        >
          <span className="text-sm font-sans text-zinc-300">{p.name}</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] tracking-widest font-mono",
              p.status === 'LIVE' ? "text-gold-light" : "text-zinc-500"
            )}>{p.status}</span>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              p.status === 'LIVE' ? "bg-gold-base animate-pulse shadow-[0_0_8px_rgba(212,175,55,1)]" : "bg-zinc-700"
            )} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const CheckIcon = () => (
  <svg className="w-5 h-5 text-gold-base shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function Home() {
  const WORDS = ["Chatbots", "Agents", "Pipelines"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const { user, login } = useAuth();

  // Timeline Scroll Logic
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineScrollProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  });
  const lineHeight = useTransform(timelineScrollProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [WORDS.length]);

  const features = [
    {
      title: "Knowledge Bases",
      description: "Upload documents, crawl websites, or sync with GitHub to ground your AI in your own data.",
      icon: BookOpen,
      visual: (
        <div className="flex flex-col h-full font-mono text-sm border border-white/10 rounded-xl bg-black/50 overflow-hidden">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center text-zinc-400 text-xs">
            <Terminal className="w-3 h-3 mr-2" /> index_workspace
          </div>
          <div className="p-6 relative flex-1 flex items-center justify-center">
            <div className="flex items-center gap-8">
              <motion.div
                className="flex flex-col gap-3"
                initial="hidden" animate="visible" variants={{
                  visible: { transition: { staggerChildren: 0.2 } }
                }}
              >
                {['docs/', 'src/', 'README.md'].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded text-zinc-300 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-zinc-500"></div> {item}
                  </motion.div>
                ))}
              </motion.div>
              <div className="w-16 h-px bg-gradient-to-r from-white/10 to-accent-cyan/50 relative">
                <motion.div
                  animate={{ x: [0, 64] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute w-2 h-2 rounded-full bg-accent-cyan shadow-[0_0_10px_#00f0ff] -top-1"
                />
              </div>
              <motion.div
                animate={{ boxShadow: ['0 0 10px #00f0ff33', '0 0 30px #00f0ff88', '0 0 10px #00f0ff33'] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-16 h-16 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center relative"
              >
                <Cpu className="text-accent-cyan w-8 h-8" />
              </motion.div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "SDK Integration",
      description: "Connect your application with our powerful JS SDK in just a few lines of code.",
      icon: Blocks,
      visual: (
        <div className="flex flex-col h-full font-mono text-sm border border-white/10 rounded-xl bg-[#09090b] overflow-hidden">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center gap-2 text-zinc-400 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div> mindflare.js
          </div>
          <div className="p-6 text-zinc-300 leading-loose flex-1 overflow-auto">
            <span className="text-blue-400">import</span> Mindflare <span className="text-blue-400">from</span> <span className="text-green-400">'mindflare-sdk'</span>;<br /><br />
            <span className="text-blue-400">const</span> mf = <span className="text-blue-400">new</span> Mindflare(<span className="text-green-400">'YOUR_API_KEY'</span>);<br /><br />
            <span className="text-zinc-500">// Connect to your knowledge base</span><br />
            <span className="text-blue-400">const</span> response = <span className="text-blue-400">await</span> mf.chat(<span className="text-green-400">"What is RAG?"</span>);<br /><br />
            console.log(response.response);
          </div>
        </div>
      )
    },
    {
      title: "Multi-channel",
      description: "Deploy your AI models across WhatsApp, Telegram, or any custom platform using our robust backend.",
      icon: Share2,
      visual: (
        <div className="flex flex-col h-full font-mono text-sm border border-white/10 rounded-xl bg-black/50 overflow-hidden">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center text-zinc-400 text-xs">
            <Share2 className="w-3 h-3 mr-2" /> Webhook Endpoints
          </div>
          <div className="p-6 relative flex-1 flex flex-col justify-center gap-4">
            {['WhatsApp (Prod)', 'Slack (Internal)', 'Telegram (Beta)'].map((channel, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-zinc-300" />
                  </div>
                  <span className="text-zinc-200">{channel}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-green-400 text-xs flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div> Healthy</span>
                  <span className="text-zinc-500 text-xs mt-1">~120ms latency</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Analytics",
      description: "Track usage, monitor costs, and gain insights into how users interact with your AI apps.",
      icon: LineChart,
      visual: (
        <div className="flex flex-col h-full font-sans border border-white/10 rounded-xl bg-[#09090b] overflow-hidden">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center text-zinc-400 text-xs font-mono">
            <LineChart className="w-3 h-3 mr-2" /> Token Usage
          </div>
          <div className="p-6 flex-1 flex flex-col justify-end relative gap-1">
            <div className="absolute top-6 left-6 grid grid-cols-2 gap-8">
              <div>
                <div className="text-zinc-500 text-xs font-mono mb-1">TOTAL TOKENS</div>
                <div className="text-3xl font-bold text-white tracking-tighter">1.2M</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs font-mono mb-1">AVG LATENCY</div>
                <div className="text-3xl font-bold text-white tracking-tighter">0.8s</div>
              </div>
            </div>
            <div className="flex items-end gap-2 h-32 mt-16">
              {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.05 }}
                  className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-accent-cyan' : 'bg-white/10'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      <Navbar />

      <div className="fixed inset-0 z-0 bg-organic-grid opacity-30 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-noise opacity-[0.04] mix-blend-overlay pointer-events-none" />
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[70vw] h-[70vw] max-w-[1000px] max-h-[1000px] bg-amber-600/15 rounded-full blur-[140px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-gold-dark/15 rounded-full blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '5s' }} />
      </div>

      <main className="flex-1 relative z-10 pt-16">
        <section className="w-full pt-20 pb-24 lg:pt-32 lg:pb-32 relative overflow-visible">
          <div className="flex flex-col lg:flex-row items-center w-full min-h-[80vh]">
            <div className="flex-1 flex flex-col items-start justify-center text-left z-10 px-6 lg:pl-16 xl:pl-32 max-w-2xl xl:max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/10 text-xs font-medium text-gold-light/80 mb-8 tracking-wide backdrop-blur-md"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gold-base animate-pulse" />
                <span>Mindflare RAG v2 is live</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-serif text-5xl md:text-7xl font-medium tracking-tight leading-[1.05] mb-6 text-white"
              >
                Build Intelligent
                <br />
                <span className="inline-flex overflow-hidden h-[1.1em] relative align-top min-w-[300px]">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={currentWordIndex}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "-100%", opacity: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="absolute left-0 italic text-gold-base pb-2 pr-4"
                    >
                      {WORDS[currentWordIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span><br />
                With Elegance.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg md:text-xl text-zinc-400 max-w-xl mb-10 leading-relaxed font-sans font-light"
              >
                Abstract away the complexity of retrieval augmented generation and model orchestrations into a single, seamless platform.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto"
              >
                {user ? (
                  <Link href="/dashboard" className="w-full sm:w-auto group relative">
                    <Button size="lg" className="relative w-full sm:w-auto h-14 px-10 rounded-full bg-white text-black hover:bg-zinc-200 font-sans font-medium tracking-wide">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <button onClick={login} className="w-full sm:w-auto group relative">
                    <Button size="lg" className="relative w-full sm:w-auto h-14 px-10 rounded-full bg-white text-black hover:bg-zinc-200 font-sans font-medium tracking-wide">
                      Start Building Free
                    </Button>
                  </button>
                )}
                <Link href="#features" className="w-full sm:w-auto group font-medium">
                  <Button variant="ghost" size="lg" className="h-14 px-8 rounded-full text-zinc-400 hover:text-white">
                    Explore Features <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            <motion.div
              className="flex-1 lg:absolute lg:right-[-10%] lg:w-[65vw] relative w-full mt-16 lg:mt-0 flex items-center justify-center lg:justify-start z-0"
              style={{ perspective: "1500px" }}
            >
              <motion.div
                initial={{ opacity: 0, rotateX: 25, rotateY: -25, y: 50 }}
                animate={{ opacity: 1, rotateX: 12, rotateY: -18, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="relative w-[95%] lg:w-[110%] xl:w-[130%] max-w-5xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] transform-gpu"
              >
                <div className="relative rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/5 overflow-hidden flex flex-col h-[450px] lg:h-[550px]">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    </div>
                  </div>
                  <div className="p-6 font-mono text-sm leading-[1.8] text-zinc-300 flex-1 overflow-hidden">
                    <div><span className="text-zinc-600">~</span> <span className="text-gold-light font-bold">❯</span> Initialize SDK</div>
                    <div className="text-zinc-500 pl-4 border-l border-white/5 my-3">
                      <span className="text-zinc-400">Created connection pool.</span><br />
                      <span className="text-gold-base">✓ Environment secured.</span>
                    </div>
                    <div><span className="text-zinc-600">~</span> <span className="text-gold-light font-bold">❯</span> const engine = new Mindflare()</div>
                    <div className="text-zinc-500 pl-4 border-l border-white/5 my-3">
                      Embedding documents... <span className="text-gold-base">[██████████] 100%</span><br />
                      Routing models initiated.<br />
                      <span className="text-gold-base">✓ Memory synced.</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-24 lg:py-40 relative overflow-hidden" ref={timelineRef}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-24 relative z-10">
              <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4 text-white">How It Works</h2>
              <p className="text-zinc-400 font-sans max-w-xl mx-auto text-lg font-light leading-relaxed">From raw data to multi-channel deployment in minutes.</p>
            </div>
            <div className="max-w-4xl mx-auto relative">
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2">
                <motion.div className="absolute top-0 left-0 w-full bg-gradient-to-b from-transparent via-gold-base to-gold-dark" style={{ height: lineHeight }} />
              </div>
              <div className="flex flex-col gap-24 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 relative">
                  <div className="flex-1 w-full md:text-right pl-20 md:pl-0 pr-0 md:pr-12">
                    <h3 className="text-3xl font-serif font-medium text-white mb-3">Ingest</h3>
                    <p className="text-zinc-400 font-sans font-light leading-relaxed">Point Mindflare at your data—GitHub, Website, or local PDFs. We handle the chunking and embedding.</p>
                  </div>
                  <div className="absolute left-8 md:left-1/2 top-1/2 w-4 h-4 rounded-full bg-black border-2 border-gold-base -translate-x-1/2 -translate-y-1/2" />
                  <div className="flex-1 w-full pl-20 md:pl-12">
                    <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
                      <DocumentToParticles />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16 relative">
                  <div className="flex-1 w-full pl-20 md:pl-12">
                    <h3 className="text-3xl font-serif font-medium text-white mb-3">Connect</h3>
                    <p className="text-zinc-400 font-sans font-light leading-relaxed">Drop our SDK into your codebase. Three lines of code to replace your entire orchestration backend.</p>
                  </div>
                  <div className="absolute left-8 md:left-1/2 top-1/2 w-4 h-4 rounded-full bg-black border-2 border-gold-base -translate-x-1/2 -translate-y-1/2" />
                  <div className="flex-1 w-full md:text-right pl-20 md:pl-0 pr-0 md:pr-12">
                    <div className="text-left font-mono text-sm p-6 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl">
                      <span className="text-blue-400">import</span> Mindflare <span className="text-blue-400">from</span> <span className="text-green-400">'mindflare-sdk'</span>;<br /><br />
                      <span className="text-blue-400">const</span> mf = <span className="text-blue-400">new</span> Mindflare();<br />
                      <span className="text-blue-400">await</span> mf.chat(<span className="text-green-400">'...'</span>);
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 relative">
                  <div className="flex-1 w-full md:text-right pl-20 md:pl-0 pr-0 md:pr-12">
                    <h3 className="text-3xl font-serif font-medium text-white mb-3">Deploy</h3>
                    <p className="text-zinc-400 font-sans font-light leading-relaxed">Go live across web, WhatsApp, and Telegram instantly. Monitored and production-ready.</p>
                  </div>
                  <div className="absolute left-8 md:left-1/2 top-1/2 w-4 h-4 rounded-full bg-black border-2 border-gold-base -translate-x-1/2 -translate-y-1/2" />
                  <div className="flex-1 w-full pl-20 md:pl-12">
                    <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
                      <DeployStatusIndicators />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-6 py-32 mb-16 relative">
          <div className="mb-20 text-left max-w-4xl relative z-10">
            <h2 className="text-4xl md:text-6xl font-serif font-medium tracking-tight mb-6 text-white leading-tight">Everything you need for AI.</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4 flex flex-col gap-3">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                const isActive = activeFeature === idx;
                return (
                  <button key={idx} onClick={() => setActiveFeature(idx)} className={`text-left p-6 rounded-2xl transition-all duration-500 relative ${isActive ? 'bg-white/[0.03] border border-white/10' : 'hover:bg-white/[0.01]'}`}>
                    {isActive && <motion.div layoutId="featureActive" className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold-light to-gold-dark" />}
                    <div className="flex items-center gap-5 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-gold-base/10 text-gold-light border border-gold-base/20' : 'bg-black/40 border border-white/5 text-zinc-500'}`}><Icon className="w-5 h-5" /></div>
                      <h3 className={`text-xl font-medium transition-all ${isActive ? 'text-white translate-x-1' : 'text-zinc-500'}`}>{feature.title}</h3>
                    </div>
                    <p className={`text-sm leading-relaxed ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}>{feature.description}</p>
                  </button>
                )
              })}
            </div>
            <div className="lg:col-span-8 relative min-h-[500px] flex items-center">
              <div className="w-full h-full glass border border-white/10 rounded-[2rem] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div key={activeFeature} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="w-full h-full p-8">{features[activeFeature].visual}</motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="w-full py-24 mb-16 relative">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-stretch">
              <div className="lg:col-span-2 bg-black/80 border border-white/10 rounded-3xl p-10 flex flex-col hover:border-white/20 transition-all">
                <h3 className="font-serif text-3xl text-white mb-2">The Platform</h3>
                <p className="text-zinc-500 text-sm mb-8 font-mono">For Developers</p>
                <ul className="space-y-4 mb-10 flex-1">
                  {['Full SDK & CLI', 'Unlimited Apps', 'Self-serve KBs', 'Realtime Analytics'].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-zinc-300"><CheckIcon /> {f}</li>
                  ))}
                </ul>
                <button onClick={login} className="w-full text-left">
                  <Button className="w-full rounded-full h-14 bg-white text-black font-semibold">Start Building</Button>
                </button>
              </div>
              <div className="lg:col-span-3 bg-gradient-to-br from-gold-dark/20 to-black/80 border border-gold-base/20 rounded-3xl p-12 relative overflow-hidden group hover:border-gold-base/40 transition-all">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-all"><Cpu className="w-32 h-32 text-gold-base rotate-12" /></div>
                <h3 className="font-serif text-4xl text-white mb-4">White-Glove</h3>
                <p className="text-gold-light/80 text-lg mb-10 font-light max-w-sm">We build and manage your custom AI agents for you.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <ul className="space-y-4">{['Custom Engineering', 'Managed Pipeline'].map(f => <li key={f} className="flex gap-3 text-white text-sm"><CheckIcon /> {f}</li>)}</ul>
                  <ul className="space-y-4">{['24/7 Priority Support', 'Dedicated Success'].map(f => <li key={f} className="flex gap-3 text-white text-sm"><CheckIcon /> {f}</li>)}</ul>
                </div>
                <Button className="w-full sm:w-auto px-10 rounded-full h-14 bg-gradient-to-r from-gold-base to-gold-dark text-black font-semibold">Book Consultation</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-16 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold font-serif text-lg">M</div>
            <span className="font-serif text-xl tracking-tight">MindflareAI</span>
          </div>
          <p className="text-sm text-zinc-500 font-sans">© 2026 MindflareAI. Engineering excellence in AI orchestration.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Terms</Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors text-sm">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
