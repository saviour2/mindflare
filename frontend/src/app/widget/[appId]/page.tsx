"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Send, Sparkles, RefreshCw, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
        { role: 'assistant', content: 'Hello! How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

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
            const res = await fetch(`http://localhost:5000/api/chat/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Mindflare-App-Id': appId,
                    'X-Mindflare-Secret': secret
                },
                body: JSON.stringify({ messages: newMsgs })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send message');

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err: any) {
            setError(err.message);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!secret) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs">
                MISSING CLIENT SECRET
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden border border-white/5 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-blue-base/10 border border-blue-base/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-base" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-medium">Assistant</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Online</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.map((m, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "flex gap-3 max-w-[85%]",
                            m.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                            m.role === 'user' ? "bg-zinc-800 border-white/10" : "bg-blue-base border-blue-base/20"
                        )}>
                            {m.role === 'user' ? <User className="w-4 h-4 text-zinc-400" /> : <Sparkles className="w-4 h-4 text-black" />}
                        </div>
                        <div className={cn(
                            "p-3 rounded-2xl text-sm leading-relaxed",
                            m.role === 'user'
                                ? "bg-zinc-800/50 text-white rounded-tr-none"
                                : "bg-white/5 text-zinc-200 border border-white/5 rounded-tl-none"
                        )}>
                            {m.content}
                        </div>
                    </motion.div>
                ))}
                {isTyping && (
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-blue-base flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 text-black animate-spin" />
                        </div>
                        <div className="p-3 rounded-2xl bg-white/5 text-zinc-400 text-sm animate-pulse">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="relative flex items-center"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-blue-base/50 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 p-1.5 rounded-lg bg-blue-base text-black disabled:opacity-30 disabled:grayscale transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
                <p className="text-[10px] text-center mt-3 text-zinc-600 font-medium tracking-tight">
                    Powered by <span className="text-blue-base/80">Mindflare AI</span>
                </p>
            </div>
        </div>
    );
}
