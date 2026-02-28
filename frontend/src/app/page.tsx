"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Zap, Bot, Database, Code, BarChart3, Shield, ArrowRight, Check, Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-secondary)] mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" />
            Now with RAG-powered knowledge bases
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Build AI-Powered<br />
            Applications in <span className="gradient-text">Minutes</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            MindflareAI provides a complete platform for creating intelligent applications with AI. Build
            chatbots, assistants, and smart tools with custom knowledge bases and seamless SDK
            integration.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => router.push(user ? '/dashboard' : '/signup')}
              className="px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg font-semibold hover:opacity-90 transition-all flex items-center gap-2"
            >
              Get started for free
            </button>
            <a href="#features" className="px-6 py-3 text-[var(--text-primary)] font-medium hover:text-blue-400 transition-colors flex items-center gap-1">
              Learn more <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-[var(--text-muted)] animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-blue-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-400" /> Free tier available
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Build AI-Powered Applications with Ease</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Everything you need to create, deploy, and manage intelligent applications powered by AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Bot className="w-6 h-6" />,
                title: "AI Applications",
                description: "Create chatbot applications powered by leading open-source LLMs. Select from Llama, Mistral, DeepSeek and more.",
                color: "blue"
              },
              {
                icon: <Database className="w-6 h-6" />,
                title: "Knowledge Bases",
                description: "Upload PDFs, crawl websites, or ingest GitHub repos. Your AI learns from your custom data using RAG.",
                color: "purple"
              },
              {
                icon: <Code className="w-6 h-6" />,
                title: "SDK & CLI",
                description: "Integrate in 3-4 lines of code with our Node.js SDK. Or use the CLI to manage your apps from the terminal.",
                color: "cyan"
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Analytics Dashboard",
                description: "Track API usage, token consumption, costs, and response times. Real-time charts powered by Recharts.",
                color: "orange"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Enterprise Security",
                description: "API key encryption, rate limiting, input sanitization, and backend-only model keys for production safety.",
                color: "green"
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Multi-Model Support",
                description: "Primary routing via OpenRouter with automatic Groq fallback. Always-on reliability for your applications.",
                color: "red"
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-light)] transition-all duration-300 group animate-fade-in"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                    feature.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                      feature.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400' :
                        feature.color === 'orange' ? 'bg-orange-500/10 text-orange-400' :
                          feature.color === 'green' ? 'bg-green-500/10 text-green-400' :
                            'bg-red-500/10 text-red-400'
                  }`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-[var(--text-secondary)]">Get started in just a few steps</p>
          </div>

          <div className="space-y-8">
            {[
              { step: "1", title: "Create an App", desc: "Sign up, create a new application, and select your preferred AI model." },
              { step: "2", title: "Upload Knowledge", desc: "Add PDFs, websites, or GitHub repos as knowledge bases for RAG." },
              { step: "3", title: "Get Your API Key", desc: "Generate a secure API key to integrate with your product." },
              { step: "4", title: "Integrate with SDK", desc: "Install mindflare-sdk and start chatting with your AI in 3 lines of code." },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start animate-fade-in" style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-[var(--text-secondary)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Code snippet */}
          <div className="mt-16 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-color)]">
              <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
              <span className="text-xs text-[var(--text-muted)] ml-2">app.ts</span>
            </div>
            <pre className="p-6 text-sm font-mono overflow-x-auto">
              <code>
                <span className="text-purple-400">import</span> <span className="text-blue-300">{"{ Mindflare }"}</span> <span className="text-purple-400">from</span> <span className="text-green-400">{'"mindflare-sdk"'}</span>;<br />
                <br />
                <span className="text-purple-400">const</span> <span className="text-blue-300">mf</span> = <span className="text-purple-400">new</span> <span className="text-yellow-300">Mindflare</span>({"{ "}
                <span className="text-blue-300">apiKey</span>: <span className="text-green-400">{'"YOUR_API_KEY"'}</span>{" }"});<br />
                <br />
                <span className="text-purple-400">const</span> <span className="text-blue-300">response</span> = <span className="text-purple-400">await</span> mf.<span className="text-yellow-300">chat</span>({"{"}<br />
                {"  "}<span className="text-blue-300">message</span>: <span className="text-green-400">{'"Explain this repository"'}</span><br />
                {"}"});<br />
                <br />
                console.<span className="text-yellow-300">log</span>(response);
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">MindflareAI</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">© 2024 MindflareAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
