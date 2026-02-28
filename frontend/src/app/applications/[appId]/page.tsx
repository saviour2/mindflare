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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
            // STOP recording
            mediaRecorderRef.current?.stop();
            setIsListening(false);
        } else {
            // START recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioChunksRef.current = [];

                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                mediaRecorder.onstop = async () => {
                    // Stop all tracks to release the microphone
                    stream.getTracks().forEach(t => t.stop());

                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    if (audioBlob.size < 1000) return; // too small, probably silence

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
                setInputValue(''); // clear old text
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
                    chatbot_name: chatbotName
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
            // Stop any currently playing audio so it doesn't talk over the new response
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

                // Trigger Voice Playing on Assistant Response
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
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw className="w-6 h-6 text-blue-base" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            {/* Background */}
            <div className="fixed inset-0 z-0 bg-organic-grid opacity-20 pointer-events-none" />
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] right-[-5%] w-[40vw] h-[40vw] bg-blue-base/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-5%] w-[35vw] h-[35vw] bg-accent-cyan/5 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <Link href="/applications" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-zinc-500" />
                    </Link>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-blue-base/10 border border-blue-base/20 flex items-center justify-center">
                            <Cpu className="w-7 h-7 text-blue-base" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-medium">{app.app_name}</h1>
                            <p className="text-zinc-500 text-sm font-mono">ID: {app.app_id}</p>
                        </div>
                    </div>
                    {app.status === 'active' && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Live</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-10 p-1 bg-white/[0.03] border border-white/10 rounded-2xl w-fit">
                    {[
                        { id: 'configure' as Tab, label: 'Configure', icon: Settings2 },
                        { id: 'playground' as Tab, label: 'Playground', icon: MessageSquare },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                                activeTab === tab.id
                                    ? "bg-blue-base text-black shadow-lg shadow-blue-base/20"
                                    : "text-zinc-500 hover:text-white"
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
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >
                            {/* Left: KB + Model */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Knowledge Bases */}
                                <Card className="rounded-[2rem]">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                                <Database className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-serif">Knowledge Sources</CardTitle>
                                                <CardDescription>Select which knowledge bases power this chatbot</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {kbs.length === 0 ? (
                                            <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-2xl">
                                                <Database className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                                <p className="text-zinc-500 text-sm mb-4">No knowledge bases found.</p>
                                                <Link href="/knowledge-base">
                                                    <Button variant="outline" className="rounded-full text-xs">
                                                        Create Knowledge Base
                                                    </Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {kbs.map(kb => (
                                                    <button
                                                        key={kb.kb_id}
                                                        onClick={() => toggleKb(kb.kb_id)}
                                                        className={cn(
                                                            "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left",
                                                            selectedKbIds.includes(kb.kb_id)
                                                                ? "bg-blue-base/10 border-blue-base/40"
                                                                : "bg-white/[0.02] border-white/10 hover:border-white/20"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0",
                                                            selectedKbIds.includes(kb.kb_id)
                                                                ? "bg-blue-base/20 border-blue-base/40 text-blue-base"
                                                                : "bg-white/5 border-white/10 text-zinc-500"
                                                        )}>
                                                            <Layers className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{kb.kb_name}</p>
                                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">
                                                                {kb.source_type} · {kb.chunks_count} chunks · {kb.status}
                                                            </p>
                                                        </div>
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                            selectedKbIds.includes(kb.kb_id)
                                                                ? "bg-blue-base border-blue-base"
                                                                : "border-white/20"
                                                        )}>
                                                            {selectedKbIds.includes(kb.kb_id) && <Check className="w-3 h-3 text-black" />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* AI Model */}
                                <Card className="rounded-[2rem]">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
                                                    <Cpu className="w-5 h-5 text-accent-cyan" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl font-serif">Language Model</CardTitle>
                                                    <CardDescription>
                                                        {modelsLoading ? 'Fetching live models...' : `${models.length} free models available`}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-widest">All Free</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {modelsLoading ? (
                                            <div className="flex flex-col gap-3">
                                                {[...Array(6)].map((_, i) => (
                                                    <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse" />
                                                ))}
                                            </div>
                                        ) : models.length === 0 ? (
                                            <p className="text-zinc-500 text-sm text-center py-8">Could not load models. Check backend connection.</p>
                                        ) : (
                                            <div className="space-y-6">
                                                {(['groq', 'openrouter'] as const).map(provider => {
                                                    const group = models.filter(m => m.provider === provider);
                                                    if (group.length === 0) return null;
                                                    return (
                                                        <div key={provider}>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", provider === 'groq' ? "bg-orange-400" : "bg-purple-400")} />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                                                    {provider === 'groq' ? '⚡ Groq — Ultra Fast' : '🔮 OpenRouter — Free Tier'}
                                                                </span>
                                                                <span className="text-[10px] text-zinc-700">({group.length})</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                {group.map((model: ModelDoc) => (
                                                                    <button
                                                                        key={model.id}
                                                                        onClick={() => setSelectedModel(model.id)}
                                                                        className={cn(
                                                                            "flex items-start justify-between p-3.5 rounded-2xl border transition-all duration-200 text-left gap-2",
                                                                            selectedModel === model.id
                                                                                ? provider === 'groq'
                                                                                    ? "bg-orange-500/10 border-orange-500/40"
                                                                                    : "bg-accent-cyan/10 border-accent-cyan/40"
                                                                                : "bg-white/[0.02] border-white/10 hover:border-white/20"
                                                                        )}
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <p className={cn(
                                                                                "text-xs font-medium truncate leading-tight",
                                                                                selectedModel === model.id
                                                                                    ? provider === 'groq' ? "text-orange-300" : "text-accent-cyan"
                                                                                    : "text-zinc-300"
                                                                            )}>{model.name}</p>
                                                                            <p className="text-[9px] text-zinc-600 font-mono mt-0.5">{(model.context_length / 1000).toFixed(0)}k ctx</p>
                                                                        </div>
                                                                        {selectedModel === model.id && (
                                                                            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5", provider === 'groq' ? "bg-orange-400" : "bg-accent-cyan")}>
                                                                                <Check className="w-2.5 h-2.5 text-black" />
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
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right: Personality */}
                            <div className="space-y-8">
                                <Card className="rounded-[2rem]">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-base/10 border border-blue-base/20 flex items-center justify-center">
                                                <Wand2 className="w-5 h-5 text-blue-base" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-serif">Personality</CardTitle>
                                                <CardDescription>Define your chatbot's identity</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Chatbot Name</label>
                                            <input
                                                type="text"
                                                value={chatbotName}
                                                onChange={e => setChatbotName(e.target.value)}
                                                placeholder="e.g. Aria"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-blue-base/50 transition-all font-sans text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Prompt</label>
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
                                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300",
                                                        generatingPrompt
                                                            ? "bg-purple-500/10 border-purple-500/30 text-purple-400 cursor-wait"
                                                            : "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/40"
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
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-base/50 transition-all font-sans text-sm resize-none leading-relaxed"
                                            />
                                        </div>
                                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                                            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                            <p className="text-xs text-zinc-500 leading-relaxed">Type a short description of your chatbot, then click <span className="text-purple-400 font-semibold">AI Assist</span> to auto-generate a detailed system prompt.</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Button
                                    onClick={saveConfig}
                                    disabled={saving}
                                    className={cn(
                                        "w-full h-14 rounded-2xl text-sm font-semibold transition-all duration-300",
                                        saved
                                            ? "bg-green-500 text-white"
                                            : "bg-blue-base text-black hover:bg-blue-light shadow-lg shadow-blue-base/20"
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
                                    className="w-full flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-blue-light transition-colors py-2"
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
                            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
                        >
                            {/* Sidebar Info */}
                            <div className="space-y-6">
                                <Card className="rounded-[2rem]">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-base/10 border border-blue-base/20 flex items-center justify-center">
                                                <Bot className="w-5 h-5 text-blue-base" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{chatbotName || app.app_name}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Active Agent</p>
                                            </div>
                                        </div>
                                        <div className="h-px bg-white/5" />
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Model</span>
                                                <span className="text-xs text-zinc-400 font-mono">{selectedModel.split('/').pop()}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Knowledge</span>
                                                <span className="text-xs text-zinc-400">{selectedKbIds.length} bases</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest flex items-center gap-1.5">
                                                    Voice Responding <Volume2 className="w-3 h-3 text-blue-base" />
                                                </span>
                                                <button
                                                    onClick={toggleVoice}
                                                    className={cn(
                                                        "w-10 h-5 rounded-full relative transition-colors duration-300",
                                                        voiceEnabled ? "bg-blue-base" : "bg-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-300",
                                                        voiceEnabled ? "left-5.5 translate-x-[22px]" : "left-0.5"
                                                    )} />
                                                </button>
                                            </div>

                                            {/* Voice Picker */}
                                            {voiceEnabled && (
                                                <div className="pt-2 border-t border-white/5 space-y-3">
                                                    <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest flex items-center gap-1.5">
                                                        <Mic className="w-3 h-3 text-blue-base" /> Intelligence Profile
                                                    </span>
                                                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {([
                                                            { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Calm Narrative', color: 'bg-rose-500/20 text-rose-300' },
                                                            { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', desc: 'Action/Strong', color: 'bg-orange-500/20 text-orange-300' },
                                                            { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Professional/Soft', color: 'bg-emerald-500/20 text-emerald-300' },
                                                            { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', desc: 'Enterprise Male', color: 'bg-blue-500/20 text-blue-300' },
                                                            { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', desc: 'Expressive/Clear', color: 'bg-amber-500/20 text-amber-300' },
                                                            { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', desc: 'Deep/Authoritative', color: 'bg-indigo-500/20 text-indigo-300' },
                                                            { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', desc: 'Crisp/American', color: 'bg-cyan-500/20 text-cyan-300' },
                                                            { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Deep Narration', color: 'bg-zinc-500/20 text-zinc-300' },
                                                            { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', desc: 'Raspy/Character', color: 'bg-orange-600/20 text-orange-400' },
                                                            { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Freya', desc: 'British Narrative', color: 'bg-purple-500/20 text-purple-300' },
                                                        ] as { id: string; name: string; desc: string; color: string }[]).map(v => (
                                                            <button
                                                                key={v.id}
                                                                onClick={() => setSelectedVoiceId(v.id)}
                                                                className={cn(
                                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-300 relative group",
                                                                    selectedVoiceId === v.id
                                                                        ? "bg-blue-base/10 border border-blue-base/30 shadow-inner"
                                                                        : "hover:bg-white/5 border border-transparent"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold border border-white/5",
                                                                    v.color
                                                                )}>
                                                                    {v.name[0]}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className={cn("text-[11px] font-bold", selectedVoiceId === v.id ? "text-blue-light" : "text-zinc-200")}>{v.name}</p>
                                                                        {selectedVoiceId === v.id && <Sparkles className="w-2.5 h-2.5 text-blue-base animate-pulse" />}
                                                                    </div>
                                                                    <p className="text-[9px] text-zinc-500 font-medium tracking-tight">{v.desc}</p>
                                                                </div>
                                                                {selectedVoiceId === v.id && (
                                                                    <motion.div layoutId="voiceActive" className="absolute left-1 w-1 h-4 bg-blue-base rounded-full" />
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
                                            className="w-full rounded-xl text-xs border-white/10 hover:bg-white/5"
                                        >
                                            <RefreshCw className="w-3 h-3 mr-2" /> Clear Chat
                                        </Button>
                                        <Button
                                            onClick={() => setActiveTab('configure')}
                                            variant="ghost"
                                            className="w-full rounded-xl text-xs text-zinc-500"
                                        >
                                            <Settings2 className="w-3 h-3 mr-2" /> Edit Config
                                        </Button>
                                    </CardContent>
                                </Card>
                                {selectedKbIds.length > 0 && (
                                    <Card className="rounded-[2rem]">
                                        <CardContent className="p-6">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Connected</p>
                                            <div className="space-y-2">
                                                {kbs.filter(k => selectedKbIds.includes(k.kb_id)).map(kb => (
                                                    <div key={kb.kb_id} className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-base" />
                                                        <span className="text-xs text-zinc-400 truncate">{kb.kb_name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Chat Interface */}
                            <div className="lg:col-span-3">
                                <Card className="rounded-[2rem] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 320px)', minHeight: '560px' }}>
                                    {/* Chat Header */}
                                    <div className="flex items-center gap-4 px-8 py-5 border-b border-white/5 bg-white/[0.01]">
                                        <motion.div
                                            animate={{ boxShadow: ['0 0 10px rgba(212,175,55,0.2)', '0 0 25px rgba(212,175,55,0.5)', '0 0 10px rgba(212,175,55,0.2)'] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="w-10 h-10 rounded-xl bg-blue-base/15 border border-blue-base/30 flex items-center justify-center"
                                        >
                                            <Bot className="w-5 h-5 text-blue-base" />
                                        </motion.div>
                                        <div>
                                            <p className="font-medium">{chatbotName || app.app_name}</p>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Online · Playground Mode</p>
                                            </div>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-base/10 border border-blue-base/20">
                                            <Sparkles className="w-3 h-3 text-blue-base" />
                                            <span className="text-[10px] font-bold text-blue-light uppercase tracking-widest">RAG Enabled</span>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                        {messages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center gap-6">
                                                <motion.div
                                                    animate={{ scale: [1, 1.05, 1] }}
                                                    transition={{ repeat: Infinity, duration: 3 }}
                                                    className="w-20 h-20 rounded-3xl bg-blue-base/10 border border-blue-base/20 flex items-center justify-center"
                                                >
                                                    <Bot className="w-10 h-10 text-blue-base" />
                                                </motion.div>
                                                <div className="text-center">
                                                    <h3 className="text-xl font-serif font-medium mb-2">
                                                        {chatbotName || app.app_name} is ready
                                                    </h3>
                                                    <p className="text-zinc-500 text-sm max-w-xs">
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
                                                            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-400 hover:border-blue-base/40 hover:text-blue-light transition-all"
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
                                                            <div className="w-8 h-8 rounded-xl bg-blue-base/15 border border-blue-base/30 flex items-center justify-center shrink-0 mt-1">
                                                                <Bot className="w-4 h-4 text-blue-base" />
                                                            </div>
                                                        )}
                                                        <div className={cn(
                                                            "max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed",
                                                            msg.role === 'user'
                                                                ? "bg-blue-base/15 border border-blue-base/20 text-white"
                                                                : "bg-white/5 border border-white/10 text-zinc-200"
                                                        )}>
                                                            {msg.content}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                {isTyping && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-blue-base/15 border border-blue-base/30 flex items-center justify-center shrink-0">
                                                            <Bot className="w-4 h-4 text-blue-base" />
                                                        </div>
                                                        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 flex items-center gap-1.5">
                                                            {[0, 1, 2].map(i => (
                                                                <motion.div
                                                                    key={i}
                                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                                                    className="w-2 h-2 rounded-full bg-zinc-500"
                                                                />
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                                <div ref={messagesEndRef} />
                                            </>
                                        )}
                                    </div>

                                    <div className="px-8 py-5 border-t border-white/5 bg-white/[0.01]">
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
                                                        "w-full bg-white/5 border rounded-2xl pl-6 pr-14 py-4 focus:outline-none transition-all font-sans text-sm",
                                                        isListening ? "border-red-500/70 bg-red-500/5 text-red-300" :
                                                            isTranscribing ? "border-blue-base/50 bg-blue-base/5" :
                                                                "border-white/10 focus:border-blue-base/50"
                                                    )}
                                                />
                                                {/* Microphone Button */}
                                                <button
                                                    onClick={toggleListening}
                                                    disabled={isTranscribing}
                                                    className={cn(
                                                        "absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                        isListening ? "text-red-400 bg-red-400/15 border border-red-400/30" :
                                                            isTranscribing ? "text-blue-base bg-blue-base/10 cursor-wait" :
                                                                "text-zinc-500 hover:text-white hover:bg-white/5"
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
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0",
                                                    inputValue.trim() && !isTyping
                                                        ? "bg-blue-base text-black shadow-lg shadow-blue-base/30 hover:bg-blue-light"
                                                        : "bg-white/5 text-zinc-600 cursor-not-allowed"
                                                )}
                                            >
                                                <Send className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                        <p className="text-center text-[10px] text-zinc-700 mt-3 font-mono">
                                            Playground · Not production traffic · Logs are tracked
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
