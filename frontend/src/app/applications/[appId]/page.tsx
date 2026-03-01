"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
    ArrowLeft, Bot, Database, Settings2, Wand2, Send, Sparkles,
    Check, RefreshCw, ChevronRight, Cpu, MessageSquare, Zap, Info, Layers,
    Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface ModelDoc {
    id: string;
    name: string;
    provider: 'openrouter' | 'groq';
    context_length: number;
    free: boolean;
}

interface KBDoc {
    kb_id: string;
    kb_name: string;
    source_type: string;
    chunks_count: number;
    status: string;
}

interface AppDoc {
    app_id: string;
    app_name: string;
    model_name: string;
    knowledge_base_ids: string[];
    system_prompt?: string;
    chatbot_name?: string;
    created_at: string;
    status?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

type Tab = 'configure' | 'playground';

/* ── Retro Window chrome ── */
const RetroPanel = ({ title, icon: Icon, children, className }: { title: string; icon?: React.ElementType; children: React.ReactNode; className?: string }) => (
    <div className={cn("border-3 border-retro-border shadow-pixel-lg bg-retro-panel", className)}>
        <div className="bg-retro-card border-b-3 border-retro-border px-4 py-2.5 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-retro-cyan" />}
            <span className="font-pixel text-sm text-retro-white">{title}</span>
        </div>
        <div className="p-5">
            {children}
        </div>
    </div>
);

export default function AppDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const appId = params.appId as string;

    const [app, setApp] = useState<AppDoc | null>(null);
    const [kbs, setKbs] = useState<KBDoc[]>([]);
    const [models, setModels] = useState<ModelDoc[]>([]);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('configure');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [generatingPrompt, setGeneratingPrompt] = useState(false);

    // Config state
    const [selectedKbIds, setSelectedKbIds] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3-8b-instruct');
    const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
    const [chatbotName, setChatbotName] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(1024);

    // Playground state
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [selectedVoiceId, setSelectedVoiceId] = useState('21m00Tcm4TlvDq8ikWAM'); // Rachel default
    const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<HTMLAudioElement | null>(null);

    const { user, isLoading } = useAuth();

    // Still need token if backend relies on it
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
        if (!isLoading && !user) { router.push('/'); return; }
        if (!token) return;

        // Fetch app config
        fetch(`http://localhost:5000/api/applications/${appId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(d => {
            if (d.app) {
                const a = d.app;
                setApp(a);
                setSelectedKbIds(a.knowledge_base_ids || []);
                setSelectedModel(a.model_name || 'meta-llama/llama-3.2-3b-instruct:free');
                setSystemPrompt(a.system_prompt || 'You are a helpful assistant.');
                setChatbotName(a.chatbot_name || a.app_name);
                setTemperature(a.temperature ?? 0.7);
                setMaxTokens(a.max_tokens ?? 1024);
            }
        }).catch(() => router.push('/applications'));

        // Fetch knowledge bases
        fetch('http://localhost:5000/api/knowledge_base/', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(d => setKbs(d.knowledge_bases || []));

        // Fetch live models from backend
        setModelsLoading(true);
        fetch('http://localhost:5000/api/models/', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(d => {
            setModels(d.models || []);
            setModelsLoading(false);
        }).catch(() => setModelsLoading(false));
    }, [appId, token, router, user, isLoading]);

    const [triggerAutoSend, setTriggerAutoSend] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        if (triggerAutoSend) {
            setTriggerAutoSend(false);
            if (inputValue.trim().length > 0) {
                sendMessage();
            }
        }
    }, [triggerAutoSend, inputValue]);

    if (isLoading || !user) return null;

    const toggleListening = async () => {
        if (isListening) {
            mediaRecorderRef.current?.stop();
            setIsListening(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioChunksRef.current = [];

                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                mediaRecorder.onstop = async () => {
                    stream.getTracks().forEach(t => t.stop());

                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    if (audioBlob.size < 1000) return;

                    setIsTranscribing(true);
                    try {
                        const formData = new FormData();
                        formData.append('audio', audioBlob, 'audio.webm');

                        const res = await fetch('http://localhost:5000/api/voice/transcribe', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                        });
                        const data = await res.json();
                        if (data.text) {
                            setInputValue(data.text);
                            setTriggerAutoSend(true);
                        } else {
                            toast.error('Could not transcribe audio. Please try again.');
                        }
                    } catch {
                        toast.error('Transcription failed.');
                    }
                    setIsTranscribing(false);
                };

                mediaRecorder.start();
                setIsListening(true);
                setInputValue('');
            } catch (err) {
                toast.error('Microphone access denied. Please allow microphone permissions.');
                console.error(err);
            }
        }
    };

    const toggleVoice = () => {
        if (voiceEnabled && currentlyPlayingAudio) {
            currentlyPlayingAudio.pause();
            setCurrentlyPlayingAudio(null);
        }
        setVoiceEnabled(!voiceEnabled);
    };

    const playVoiceAudio = async (text: string) => {
        if (!token || !voiceEnabled) return;

        try {
            const res = await fetch('http://localhost:5000/api/voice/synthesize', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice_id: selectedVoiceId })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                setCurrentlyPlayingAudio(audio);
                audio.play();
                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    if (currentlyPlayingAudio === audio) setCurrentlyPlayingAudio(null);
                };
            }
        } catch (err) {
            console.error("Failed to fetch TTS audio", err);
        }
    };


    const toggleKb = (kbId: string) => {
        setSelectedKbIds(prev =>
            prev.includes(kbId) ? prev.filter(id => id !== kbId) : [...prev, kbId]
        );
    };

    const saveConfig = async () => {
        if (!token) return;
        setSaving(true);
        const tid = toast.loading('Saving configuration...');
        try {
            const res = await fetch(`http://localhost:5000/api/applications/${appId}/config`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    knowledge_base_ids: selectedKbIds,
                    model_name: selectedModel,
                    system_prompt: systemPrompt,
                    chatbot_name: chatbotName,
                    temperature,
                    max_tokens: maxTokens
                })
            });
            toast.dismiss(tid);
            if (res.ok) {
                toast.success('Configuration saved and deployed!');
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } else {
                toast.error('Failed to save configuration.');
            }
        } catch {
            toast.dismiss(tid);
            toast.error('Network error. Please try again.');
        }
        setSaving(false);
    };

    const sendMessage = async () => {
        const text = inputValue.trim();
        if (!text || isTyping) return;
        setInputValue('');

        const newMessages: Message[] = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            if (currentlyPlayingAudio) {
                currentlyPlayingAudio.pause();
                setCurrentlyPlayingAudio(null);
            }

            const res = await fetch(`http://localhost:5000/api/chat/playground/${appId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
                setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + data.error }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

                if (voiceEnabled) {
                    playVoiceAudio(data.response);
                }
            }
        } catch {
            toast.error('Connection error. Check your backend.');
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
        }
        setIsTyping(false);
    };

    if (!app) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="fixed inset-0 z-0 bg-[#2F3947]/60 backdrop-blur-[2px] pointer-events-none" />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw className="w-6 h-6 text-retro-cyan" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-retro-white">
            <Navbar />

            {/* Dark backdrop overlay */}
            <div className="fixed inset-0 z-0 bg-[#2F3947]/60 backdrop-blur-[2px] pointer-events-none" />

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/applications" className="p-2 border-3 border-retro-border bg-retro-card shadow-pixel-sm hover:bg-retro-panel transition-colors">
                        <ArrowLeft className="w-5 h-5 text-retro-muted" />
                    </Link>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 bg-retro-card border-3 border-retro-border shadow-pixel-sm flex items-center justify-center">
                            <Cpu className="w-7 h-7 text-retro-cyan" />
                        </div>
                        <div>
                            <h1 className="font-pixel text-3xl text-retro-white" style={{ textShadow: '2px 2px 0px #2F3947' }}>{app.app_name}</h1>
                            <p className="text-retro-dim text-xs font-mono">ID: {app.app_id}</p>
                        </div>
                    </div>
                    {app.status === 'active' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-retro-card border-3 border-retro-border shadow-pixel-sm">
                            <div className="w-2 h-2 bg-[#A8D8B0] border border-[#78B080] animate-pixel-blink" />
                            <span className="text-xs font-pixel text-[#A8D8B0] uppercase tracking-widest">Live</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-0 mb-8">
                    {[
                        { id: 'configure' as Tab, label: 'Configure', icon: Settings2 },
                        { id: 'playground' as Tab, label: 'Playground', icon: MessageSquare },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 border-3 font-pixel text-sm transition-all duration-200",
                                activeTab === tab.id
                                    ? "bg-retro-cyan text-retro-ink border-[#D68FA3] shadow-pixel-sm z-10"
                                    : "bg-retro-card text-retro-muted border-retro-border hover:bg-retro-panel hover:text-retro-white"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'configure' ? (
                        <motion.div
                            key="configure"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >
                            {/* Left: KB + Model */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Knowledge Bases */}
                                <RetroPanel title="KNOWLEDGE SOURCES" icon={Database}>
                                    {kbs.length === 0 ? (
                                        <div className="text-center py-10 border-3 border-dashed border-retro-border">
                                            <Database className="w-10 h-10 text-retro-dim mx-auto mb-3" />
                                            <p className="text-retro-muted text-sm mb-4 font-mono">No knowledge bases found.</p>
                                            <Link href="/knowledge-base">
                                                <Button className="font-pixel text-sm">
                                                    Create Knowledge Base
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {kbs.map(kb => (
                                                <button
                                                    key={kb.kb_id}
                                                    onClick={() => toggleKb(kb.kb_id)}
                                                    className={cn(
                                                        "w-full flex items-center gap-4 p-4 border-3 transition-all duration-200 text-left",
                                                        selectedKbIds.includes(kb.kb_id)
                                                            ? "bg-retro-cyan/10 border-retro-cyan shadow-pixel-sm"
                                                            : "bg-retro-card border-retro-border hover:border-retro-muted"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 flex items-center justify-center border-3 transition-colors shrink-0",
                                                        selectedKbIds.includes(kb.kb_id)
                                                            ? "bg-retro-cyan/20 border-retro-cyan text-retro-cyan"
                                                            : "bg-retro-card border-retro-border text-retro-dim"
                                                    )}>
                                                        <Layers className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-pixel text-sm text-retro-white truncate">{kb.kb_name}</p>
                                                        <p className="text-[10px] text-retro-dim uppercase font-pixel tracking-widest mt-0.5">
                                                            {kb.source_type} · {kb.chunks_count} chunks · {kb.status}
                                                        </p>
                                                    </div>
                                                    <div className={cn(
                                                        "w-5 h-5 border-3 flex items-center justify-center shrink-0 transition-all",
                                                        selectedKbIds.includes(kb.kb_id)
                                                            ? "bg-retro-cyan border-[#D68FA3]"
                                                            : "border-retro-border"
                                                    )}>
                                                        {selectedKbIds.includes(kb.kb_id) && <Check className="w-3 h-3 text-retro-ink" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </RetroPanel>

                                {/* AI Model */}
                                <RetroPanel title="LANGUAGE MODEL" icon={Cpu}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-retro-muted text-xs font-mono">
                                            {modelsLoading ? 'Fetching live models...' : `${models.length} free models available`}
                                        </span>
                                        <span className="text-[9px] font-pixel px-3 py-1 bg-[#A8D8B0]/20 text-[#A8D8B0] border-3 border-[#78B080]">ALL FREE</span>
                                    </div>

                                    {modelsLoading ? (
                                        <div className="flex flex-col gap-2">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="h-12 bg-retro-card border-3 border-retro-border animate-pulse" />
                                            ))}
                                        </div>
                                    ) : models.length === 0 ? (
                                        <p className="text-retro-muted text-sm text-center py-8 font-mono">Could not load models. Check backend connection.</p>
                                    ) : (
                                        <div className="space-y-5">
                                            {(['groq', 'openrouter'] as const).map(provider => {
                                                const group = models.filter(m => m.provider === provider);
                                                if (group.length === 0) return null;
                                                return (
                                                    <div key={provider}>
                                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b-3 border-retro-border">
                                                            <span className={cn("w-2 h-2", provider === 'groq' ? "bg-[#D8C4A8]" : "bg-[#C4A8D8]")} />
                                                            <span className="text-[10px] font-pixel uppercase tracking-widest text-retro-muted">
                                                                {provider === 'groq' ? '⚡ Groq — Ultra Fast' : '🔮 OpenRouter — Free Tier'}
                                                            </span>
                                                            <span className="text-[10px] text-retro-dim font-mono">({group.length})</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {group.map((model: ModelDoc) => (
                                                                <button
                                                                    key={model.id}
                                                                    onClick={() => setSelectedModel(model.id)}
                                                                    className={cn(
                                                                        "flex items-start justify-between p-3 border-3 transition-all duration-200 text-left gap-2",
                                                                        selectedModel === model.id
                                                                            ? "bg-retro-cyan/10 border-retro-cyan shadow-pixel-sm"
                                                                            : "bg-retro-card border-retro-border hover:border-retro-muted"
                                                                    )}
                                                                >
                                                                    <div className="min-w-0">
                                                                        <p className={cn(
                                                                            "text-xs font-pixel truncate leading-tight",
                                                                            selectedModel === model.id
                                                                                ? "text-retro-cyan"
                                                                                : "text-retro-white"
                                                                        )}>{model.name}</p>
                                                                        <p className="text-[9px] text-retro-dim font-mono mt-1">{(model.context_length / 1000).toFixed(0)}k ctx</p>
                                                                    </div>
                                                                    {selectedModel === model.id && (
                                                                        <div className="w-4 h-4 bg-retro-cyan flex items-center justify-center shrink-0 mt-0.5">
                                                                            <Check className="w-2.5 h-2.5 text-retro-ink" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </RetroPanel>
                            </div>

                            {/* Right: Personality */}
                            <div className="space-y-6">
                                <RetroPanel title="PERSONALITY" icon={Wand2}>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-pixel text-retro-dim uppercase tracking-widest">Chatbot Name</label>
                                            <input
                                                type="text"
                                                value={chatbotName}
                                                onChange={e => setChatbotName(e.target.value)}
                                                placeholder="e.g. Aria"
                                                className="w-full bg-retro-card border-3 border-retro-border px-4 py-3 focus:outline-none focus:border-retro-cyan transition-all font-mono text-sm text-retro-white placeholder:text-retro-dim"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-pixel text-retro-dim uppercase tracking-widest">System Prompt</label>
                                                <button
                                                    onClick={async () => {
                                                        if (!systemPrompt.trim() || generatingPrompt) return;
                                                        setGeneratingPrompt(true);
                                                        try {
                                                            const res = await fetch('http://localhost:5000/api/applications/generate-prompt', {
                                                                method: 'POST',
                                                                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ description: systemPrompt })
                                                            });
                                                            const data = await res.json();
                                                            if (res.ok && data.prompt) {
                                                                setSystemPrompt(data.prompt);
                                                                toast.success('System prompt generated!');
                                                            } else {
                                                                toast.error(data.error || 'Failed to generate prompt');
                                                            }
                                                        } catch {
                                                            toast.error('Network error');
                                                        }
                                                        setGeneratingPrompt(false);
                                                    }}
                                                    disabled={generatingPrompt || !systemPrompt.trim()}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1.5 font-pixel text-[10px] uppercase tracking-widest border-3 transition-all duration-200",
                                                        generatingPrompt
                                                            ? "bg-[#C4A8D8]/10 border-[#C4A8D8]/30 text-[#C4A8D8] cursor-wait"
                                                            : "bg-[#C4A8D8]/10 border-[#C4A8D8]/20 text-[#C4A8D8] hover:bg-[#C4A8D8]/20 hover:border-[#C4A8D8]/40"
                                                    )}
                                                >
                                                    {generatingPrompt ? (
                                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                                            <RefreshCw className="w-3 h-3" />
                                                        </motion.div>
                                                    ) : (
                                                        <Sparkles className="w-3 h-3" />
                                                    )}
                                                    {generatingPrompt ? 'Generating...' : 'AI Assist'}
                                                </button>
                                            </div>
                                            <textarea
                                                value={systemPrompt}
                                                onChange={e => setSystemPrompt(e.target.value)}
                                                rows={6}
                                                placeholder="Type a short description like 'customer support bot for an e-commerce store' then click AI Assist..."
                                                className="w-full bg-retro-card border-3 border-retro-border px-4 py-3 focus:outline-none focus:border-retro-cyan transition-all font-mono text-sm text-retro-white resize-none leading-relaxed placeholder:text-retro-dim"
                                            />
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-[#C4A8D8]/10 border-3 border-[#C4A8D8]/20">
                                            <Sparkles className="w-4 h-4 text-[#C4A8D8] shrink-0 mt-0.5" />
                                            <p className="text-xs text-retro-muted leading-relaxed font-mono">Type a short description of your chatbot, then click <span className="text-[#C4A8D8] font-bold">AI Assist</span> to auto-generate a detailed system prompt.</p>
                                        </div>
                                    </div>
                                </RetroPanel>

                                {/* Model Parameters */}
                                <RetroPanel title="MODEL PARAMETERS" icon={Settings2}>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-pixel text-retro-dim uppercase tracking-widest">Temperature</label>
                                                <span className="text-sm font-pixel text-retro-cyan font-bold">{temperature.toFixed(1)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.1"
                                                value={temperature}
                                                onChange={e => setTemperature(parseFloat(e.target.value))}
                                                className="retro-slider"
                                            />
                                            <div className="flex justify-between text-[9px] text-retro-dim font-pixel">
                                                <span>0.0 Precise</span>
                                                <span>1.0 Balanced</span>
                                                <span>2.0 Creative</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-pixel text-retro-dim uppercase tracking-widest">Max Tokens</label>
                                                <span className="text-sm font-pixel text-retro-cyan font-bold">{maxTokens}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="64"
                                                max="4096"
                                                step="64"
                                                value={maxTokens}
                                                onChange={e => setMaxTokens(parseInt(e.target.value))}
                                                className="retro-slider"
                                            />
                                            <div className="flex justify-between text-[9px] text-retro-dim font-pixel">
                                                <span>64 Short</span>
                                                <span>1024 Medium</span>
                                                <span>4096 Long</span>
                                            </div>
                                        </div>
                                    </div>
                                </RetroPanel>

                                <Button
                                    onClick={saveConfig}
                                    disabled={saving}
                                    className={cn(
                                        "w-full h-14 font-pixel text-base transition-all duration-200",
                                        saved
                                            ? "bg-[#A8D8B0] text-retro-ink border-3 border-[#78B080]"
                                            : ""
                                    )}
                                >
                                    {saving ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                            <RefreshCw className="w-4 h-4" />
                                        </motion.div>
                                    ) : saved ? (
                                        <><Check className="w-4 h-4 mr-2" /> Configuration Saved!</>
                                    ) : (
                                        <><Zap className="w-4 h-4 mr-2" /> Save & Deploy Config</>
                                    )}
                                </Button>

                                <button
                                    onClick={() => { saveConfig().then(() => setActiveTab('playground')); }}
                                    className="w-full flex items-center justify-center gap-2 text-sm text-retro-muted hover:text-retro-cyan transition-colors py-2 font-pixel"
                                >
                                    Go to Playground <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="playground"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
                        >
                            {/* Sidebar Info */}
                            <div className="space-y-4">
                                <RetroPanel title="AGENT INFO" icon={Bot}>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-retro-card border-3 border-retro-border flex items-center justify-center">
                                                <Bot className="w-5 h-5 text-retro-cyan" />
                                            </div>
                                            <div>
                                                <p className="font-pixel text-sm text-retro-white">{chatbotName || app.app_name}</p>
                                                <p className="text-[10px] text-retro-dim uppercase font-pixel tracking-widest">Active Agent</p>
                                            </div>
                                        </div>
                                        <div className="h-px bg-retro-border" />
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-retro-dim uppercase font-pixel tracking-widest">Model</span>
                                                <span className="text-xs text-retro-muted font-mono">{selectedModel.split('/').pop()}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-retro-dim uppercase font-pixel tracking-widest">Knowledge</span>
                                                <span className="text-xs text-retro-muted font-mono">{selectedKbIds.length} bases</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t-3 border-retro-border">
                                                <span className="text-[10px] text-retro-dim uppercase font-pixel tracking-widest flex items-center gap-1.5">
                                                    Voice <Volume2 className="w-3 h-3 text-retro-cyan" />
                                                </span>
                                                <button
                                                    onClick={toggleVoice}
                                                    className={cn(
                                                        "px-3 py-1 border-3 font-pixel text-[10px] transition-colors duration-200",
                                                        voiceEnabled
                                                            ? "bg-retro-cyan/20 border-retro-cyan text-retro-cyan"
                                                            : "bg-retro-card border-retro-border text-retro-dim"
                                                    )}
                                                >
                                                    {voiceEnabled ? 'ON' : 'OFF'}
                                                </button>
                                            </div>

                                            {/* Voice Picker */}
                                            {voiceEnabled && (
                                                <div className="pt-2 border-t-3 border-retro-border space-y-3">
                                                    <span className="text-[10px] text-retro-dim uppercase font-pixel tracking-widest flex items-center gap-1.5">
                                                        <Mic className="w-3 h-3 text-retro-cyan" /> Intelligence Profile
                                                    </span>
                                                    <div className="space-y-1 max-h-[300px] overflow-y-auto retro-scrollbar">
                                                        {([
                                                            { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Calm Narrative' },
                                                            { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', desc: 'Action/Strong' },
                                                            { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Professional/Soft' },
                                                            { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', desc: 'Enterprise Male' },
                                                            { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', desc: 'Expressive/Clear' },
                                                            { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', desc: 'Deep/Authoritative' },
                                                            { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', desc: 'Crisp/American' },
                                                            { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Deep Narration' },
                                                            { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', desc: 'Raspy/Character' },
                                                            { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Freya', desc: 'British Narrative' },
                                                        ] as { id: string; name: string; desc: string }[]).map(v => (
                                                            <button
                                                                key={v.id}
                                                                onClick={() => setSelectedVoiceId(v.id)}
                                                                className={cn(
                                                                    "w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-200 border-3",
                                                                    selectedVoiceId === v.id
                                                                        ? "bg-retro-cyan/10 border-retro-cyan"
                                                                        : "bg-retro-card border-transparent hover:border-retro-border"
                                                                )}
                                                            >
                                                                <div className="w-6 h-6 bg-retro-card border-3 border-retro-border flex items-center justify-center text-[10px] font-pixel text-retro-cyan">
                                                                    {v.name[0]}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className={cn("text-[11px] font-pixel", selectedVoiceId === v.id ? "text-retro-cyan" : "text-retro-white")}>{v.name}</p>
                                                                    <p className="text-[9px] text-retro-muted font-mono">{v.desc}</p>
                                                                </div>
                                                                {selectedVoiceId === v.id && (
                                                                    <div className="w-2 h-4 bg-retro-cyan" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => setMessages([])}
                                            variant="outline"
                                            className="w-full font-pixel text-xs"
                                        >
                                            <RefreshCw className="w-3 h-3 mr-2" /> Clear Chat
                                        </Button>
                                        <Button
                                            onClick={() => setActiveTab('configure')}
                                            variant="outline"
                                            className="w-full font-pixel text-xs text-retro-muted"
                                        >
                                            <Settings2 className="w-3 h-3 mr-2" /> Edit Config
                                        </Button>
                                    </div>
                                </RetroPanel>
                                {selectedKbIds.length > 0 && (
                                    <RetroPanel title="CONNECTED KBs" icon={Database}>
                                        <div className="space-y-2">
                                            {kbs.filter(k => selectedKbIds.includes(k.kb_id)).map(kb => (
                                                <div key={kb.kb_id} className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-retro-cyan" />
                                                    <span className="text-xs text-retro-muted font-mono truncate">{kb.kb_name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </RetroPanel>
                                )}
                            </div>

                            {/* Chat Interface */}
                            <div className="lg:col-span-3">
                                <div className="border-3 border-retro-border shadow-pixel-lg bg-retro-panel flex flex-col" style={{ height: 'calc(100vh - 320px)', minHeight: '560px' }}>
                                    {/* Chat Header */}
                                    <div className="flex items-center gap-4 px-6 py-4 border-b-3 border-retro-border bg-retro-card">
                                        <div className="w-10 h-10 bg-retro-panel border-3 border-retro-border flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-retro-cyan" />
                                        </div>
                                        <div>
                                            <p className="font-pixel text-sm text-retro-white">{chatbotName || app.app_name}</p>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 bg-[#A8D8B0] animate-pixel-blink" />
                                                <p className="text-[10px] text-retro-dim uppercase font-pixel tracking-widest">Online · Playground Mode</p>
                                            </div>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-retro-cyan/10 border-3 border-retro-cyan">
                                            <Sparkles className="w-3 h-3 text-retro-cyan" />
                                            <span className="text-[10px] font-pixel text-retro-cyan uppercase tracking-widest">RAG Enabled</span>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 retro-scrollbar">
                                        {messages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center gap-6">
                                                <div className="w-20 h-20 bg-retro-card border-3 border-retro-border shadow-pixel-lg flex items-center justify-center">
                                                    <Bot className="w-10 h-10 text-retro-cyan" />
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="font-pixel text-xl text-retro-white mb-2" style={{ textShadow: '2px 2px 0px #2F3947' }}>
                                                        {chatbotName || app.app_name} is ready
                                                    </h3>
                                                    <p className="text-retro-muted text-sm max-w-xs font-mono">
                                                        {selectedKbIds.length > 0
                                                            ? `Powered by ${selectedKbIds.length} knowledge base${selectedKbIds.length > 1 ? 's' : ''}. Ask me anything!`
                                                            : 'No knowledge bases connected. Responding from base model knowledge.'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2 justify-center">
                                                    {["What can you help me with?", "Tell me about yourself", "What do you know?"].map(q => (
                                                        <button
                                                            key={q}
                                                            onClick={() => setInputValue(q)}
                                                            className="px-4 py-2 bg-retro-card border-3 border-retro-border text-sm text-retro-muted hover:border-retro-cyan hover:text-retro-cyan transition-all font-mono"
                                                        >
                                                            {q}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {messages.map((msg, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}
                                                    >
                                                        {msg.role === 'assistant' && (
                                                            <div className="w-8 h-8 bg-retro-card border-3 border-retro-border flex items-center justify-center shrink-0 mt-1">
                                                                <Bot className="w-4 h-4 text-retro-cyan" />
                                                            </div>
                                                        )}
                                                        <div className={cn(
                                                            "max-w-[75%] px-5 py-3.5 text-sm leading-relaxed font-mono border-3",
                                                            msg.role === 'user'
                                                                ? "bg-retro-cyan/10 border-retro-cyan text-retro-white"
                                                                : "bg-retro-card border-retro-border text-retro-muted"
                                                        )}>
                                                            {msg.content}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                {isTyping && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                                        <div className="w-8 h-8 bg-retro-card border-3 border-retro-border flex items-center justify-center shrink-0">
                                                            <Bot className="w-4 h-4 text-retro-cyan" />
                                                        </div>
                                                        <div className="bg-retro-card border-3 border-retro-border px-5 py-3.5 flex items-center gap-2">
                                                            {[0, 1, 2].map(i => (
                                                                <motion.div
                                                                    key={i}
                                                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                                                    className="w-2 h-2 bg-retro-cyan"
                                                                />
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                                <div ref={messagesEndRef} />
                                            </>
                                        )}
                                    </div>

                                    <div className="px-6 py-4 border-t-3 border-retro-border bg-retro-card">
                                        <div className="flex gap-3 items-center relative">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    value={isTranscribing ? '' : inputValue}
                                                    onChange={e => setInputValue(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                                    placeholder={
                                                        isListening ? '🔴 Recording... click mic to stop' :
                                                            isTranscribing ? '⏳ Transcribing your voice...' :
                                                                `Message ${chatbotName || app.app_name}...`
                                                    }
                                                    disabled={isListening || isTranscribing}
                                                    className={cn(
                                                        "w-full bg-retro-panel border-3 pl-5 pr-14 py-3.5 focus:outline-none transition-all font-mono text-sm text-retro-white placeholder:text-retro-dim",
                                                        isListening ? "border-[#D88A8A] bg-[#D88A8A]/10" :
                                                            isTranscribing ? "border-retro-cyan bg-retro-cyan/5" :
                                                                "border-retro-border focus:border-retro-cyan"
                                                    )}
                                                />
                                                {/* Microphone Button */}
                                                <button
                                                    onClick={toggleListening}
                                                    disabled={isTranscribing}
                                                    className={cn(
                                                        "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-all border-3",
                                                        isListening ? "text-[#D88A8A] bg-[#D88A8A]/15 border-[#D88A8A]" :
                                                            isTranscribing ? "text-retro-cyan bg-retro-cyan/10 border-retro-cyan cursor-wait" :
                                                                "text-retro-dim border-transparent hover:text-retro-white hover:border-retro-border hover:bg-retro-panel"
                                                    )}
                                                >
                                                    {isListening ? (
                                                        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                                                            <Mic className="w-4 h-4" />
                                                        </motion.div>
                                                    ) : isTranscribing ? (
                                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                                            <RefreshCw className="w-4 h-4" />
                                                        </motion.div>
                                                    ) : (
                                                        <Mic className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={sendMessage}
                                                disabled={!inputValue.trim() || isTyping}
                                                className={cn(
                                                    "w-14 h-14 border-3 flex items-center justify-center transition-all shrink-0",
                                                    inputValue.trim() && !isTyping
                                                        ? "bg-retro-cyan text-retro-ink border-[#D68FA3] shadow-pixel-sm hover:bg-[#F5BED0]"
                                                        : "bg-retro-card text-retro-dim border-retro-border cursor-not-allowed"
                                                )}
                                            >
                                                <Send className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                        <p className="text-center text-[10px] text-retro-dim mt-3 font-pixel">
                                            Playground · Not production traffic · Logs are tracked
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
