"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Send, Sparkles, RefreshCw, Bot, User, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

/* ── Markdown-rendered message bubble ── */
function FormattedMessage({ content, role }: { content: string; role: string }) {
    if (role === 'user') return <span>{content}</span>;

    return (
        <ReactMarkdown
            components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-[1.6] text-[13.5px] text-zinc-200/95">{children}</p>,
                strong: ({ children }) => <strong className="text-white font-[650]">{children}</strong>,
                em: ({ children }) => <em className="text-zinc-400 italic">{children}</em>,
                ul: ({ children }) => <ul className="pl-5 my-2.5 space-y-1.5 list-disc marker:text-emerald-500/70">{children}</ul>,
                ol: ({ children }) => <ol className="pl-5 my-2.5 space-y-1.5 list-decimal marker:text-emerald-500/70 marker:font-medium">{children}</ol>,
                li: ({ children }) => <li className="pl-0.5 leading-[1.6] text-[13.5px] text-zinc-200/95">{children}</li>,
                code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) {
                        return (
                            <div className="my-3 rounded-lg overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                                <div className="flex items-center px-3 py-1.5 bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold select-none">Code</div>
                                <pre className="p-3 overflow-x-auto text-[12.5px] leading-relaxed">
                                    <code className="text-emerald-300 font-mono">{children}</code>
                                </pre>
                            </div>
                        );
                    }
                    return (
                        <code className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[12px] font-mono border border-emerald-500/20">
                            {children}
                        </code>
                    );
                },
                pre: ({ children }) => <>{children}</>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-[3px] decoration-emerald-500/40 hover:decoration-emerald-400 transition-colors font-medium">{children}</a>,
                h1: ({ children }) => <h1 className="text-base font-bold text-white mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-[15px] font-bold text-white mt-4 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-[14px] font-semibold text-white mt-3 mb-1.5">{children}</h3>,
                hr: () => <hr className="border-none h-px bg-white/10 my-4" />,
                blockquote: ({ children }) => <blockquote className="border-l-[3px] border-emerald-500/60 pl-3 my-2.5 text-zinc-400 italic bg-emerald-500/5 py-1 pr-2 rounded-r">{children}</blockquote>,
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatWidget() {
    const params = useParams();
    const searchParams = useSearchParams();
    const appId = params.appId as string;
    const secret = searchParams.get('secret');

    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '👋 Hey there! I\'m your AI assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping || !secret) return;

        setInput('');
        const newMsgs: Message[] = [...messages, { role: 'user', content: text }];
        setMessages(newMsgs);
        setIsTyping(true);
        setError(null);

        try {
            const res = await fetch(`http://localhost:5000/api/chat/playground/${appId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${secret}`
                },
                body: JSON.stringify({ messages: newMsgs })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send message');

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err: any) {
            setError(err.message);
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}` }]);
        } finally {
            setIsTyping(false);
            inputRef.current?.focus();
        }
    };

    if (!secret) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs">
                MISSING TOKEN
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen text-zinc-100 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0c0c0c 0%, #111111 100%)' }}>
            {/* ── Header ── */}
            <div className="relative px-5 py-4" style={{ background: 'linear-gradient(135deg, rgba(48,175,91,0.12) 0%, rgba(34,197,94,0.05) 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Glow accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #30AF5B, transparent)' }} />

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #30AF5B, #22c55e)', boxShadow: '0 4px 15px rgba(48,175,91,0.3)' }}>
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        {/* Online pulse */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-zinc-950">
                            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-50" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold tracking-tight text-white">Mindflare Assistant</h3>
                        <span className="text-[10px] text-emerald-400/80 font-medium tracking-wider uppercase">● Online — Ready to help</span>
                    </div>
                </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
                <AnimatePresence>
                    {messages.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className={cn(
                                "flex gap-2.5",
                                m.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            {m.role === 'assistant' && (
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1" style={{ background: 'linear-gradient(135deg, #30AF5B, #16a34a)', boxShadow: '0 2px 8px rgba(48,175,91,0.25)' }}>
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "px-3.5 py-2.5 text-[13px] leading-relaxed max-w-[80%]",
                                    m.role === 'user'
                                        ? "rounded-2xl rounded-br-md text-white"
                                        : "rounded-2xl rounded-bl-md text-zinc-200"
                                )}
                                style={m.role === 'user'
                                    ? { background: 'linear-gradient(135deg, #30AF5B, #22c55e)', boxShadow: '0 2px 12px rgba(48,175,91,0.2)' }
                                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }
                                }
                            >
                                <FormattedMessage content={m.content} role={m.role} />
                            </div>
                            {m.role === 'user' && (
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <User className="w-3.5 h-3.5 text-zinc-400" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2.5"
                    >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #30AF5B, #16a34a)' }}>
                            <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5 items-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </motion.div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* ── Input Area ── */}
            <div className="px-4 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="relative flex items-center"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full rounded-xl py-3 pl-4 pr-12 text-[13px] focus:outline-none transition-all duration-200"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#e4e4e7',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(48,175,91,0.4)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(48,175,91,0.08)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-1.5 p-2 rounded-lg transition-all duration-200 disabled:opacity-20"
                        style={{
                            background: input.trim() && !isTyping ? 'linear-gradient(135deg, #30AF5B, #22c55e)' : 'transparent',
                            boxShadow: input.trim() && !isTyping ? '0 2px 8px rgba(48,175,91,0.3)' : 'none',
                        }}
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </form>
                <p className="text-[9px] text-center mt-2 font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Powered by <span style={{ color: 'rgba(48,175,91,0.6)' }}>Mindflare AI</span>
                </p>
            </div>
        </div>
    );
}
