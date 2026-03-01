'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Github, FileText, FolderOpen, Folder, File, Database, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeNode {
    name: string;
    type: 'root' | 'section' | 'page' | 'directory' | 'file';
    chunks?: number;
    preview?: string;
    children?: TreeNode[];
}

interface TreeMeta {
    total_chunks: number;
    total_chars: number;
    source_pages: number;
    source_type: string;
}

interface TreeData extends TreeNode {
    meta: TreeMeta;
}

interface KBTreeVisualizationProps {
    kbId: string;
    kbName: string;
    sourceType: string;
    token: string;
    onClose: () => void;
}

// ── Layout ──────────────────────────────────────────────────────────────────
const NODE_W = 160;
const NODE_H = 52;
const H_GAP = 80;   // horizontal gap between levels
const V_GAP = 18;   // vertical gap between sibling nodes

interface LayoutNode {
    node: TreeNode;
    x: number;
    y: number;
    depth: number;
    id: string;
    parentId: string | null;
}

function buildLayout(root: TreeNode): { nodes: LayoutNode[]; width: number; height: number } {
    const nodes: LayoutNode[] = [];
    let maxY = 0;
    let maxDepth = 0;

    // First pass: calculate subtree sizes
    function subtreeHeight(n: TreeNode): number {
        if (!n.children || n.children.length === 0) return 1;
        return n.children.reduce((sum, c) => sum + subtreeHeight(c), 0);
    }

    // Second pass: assign positions
    function assign(n: TreeNode, depth: number, yStart: number, parentId: string | null, prefix: string): number {
        const id = `${prefix}-${depth}-${n.name}`;
        const sh = subtreeHeight(n);
        const yCenter = yStart + (sh * (NODE_H + V_GAP)) / 2 - (NODE_H + V_GAP) / 2;
        const x = depth * (NODE_W + H_GAP);
        const y = yCenter;

        nodes.push({ node: n, x, y, depth, id, parentId });
        maxY = Math.max(maxY, y + NODE_H);
        maxDepth = Math.max(maxDepth, depth);

        if (n.children && n.children.length > 0) {
            let childY = yStart;
            for (const child of n.children) {
                const csh = subtreeHeight(child);
                assign(child, depth + 1, childY, id, id);
                childY += csh * (NODE_H + V_GAP);
            }
        }

        return sh;
    }

    assign(root, 0, 0, null, 'root');

    const width = (maxDepth + 1) * (NODE_W + H_GAP);
    const height = maxY + 20;

    return { nodes, width, height };
}

// ── Colors ────────────────────────────────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    root: { bg: '#1A2B3C', border: '#F2AEC0', text: '#F2AEC0', badge: '#F2AEC0' },
    section: { bg: '#1E2A3A', border: '#C4A8D8', text: '#C4A8D8', badge: '#C4A8D8' },
    page: { bg: '#1A2E28', border: '#A8D8B0', text: '#A8D8B0', badge: '#A8D8B0' },
    directory: { bg: '#2A281A', border: '#D8C4A8', text: '#D8C4A8', badge: '#D8C4A8' },
    file: { bg: '#2A2A2A', border: '#536175', text: '#B0B8C6', badge: '#536175' },
};

const NodeIcon = ({ type, sourceType, size = 14 }: { type: string; sourceType: string; size?: number }) => {
    const s = { width: size, height: size };
    if (type === 'root') {
        if (sourceType === 'website') return <Globe style={s} />;
        if (sourceType === 'github') return <Github style={s} />;
        return <FileText style={s} />;
    }
    if (type === 'directory') return <Folder style={s} />;
    if (type === 'file') return <File style={s} />;
    if (type === 'section') return <FolderOpen style={s} />;
    if (type === 'page') return <Globe style={s} />;
    return <Database style={s} />;
};

// ── SVG Elbow connector ────────────────────────────────────────────────────
function Connector({ from, to }: {
    from: { x: number; y: number };
    to: { x: number; y: number };
}) {
    // "elbow" path: right from parent center-right → horizontal mid → down/up → left to child center-left
    const x1 = from.x + NODE_W;
    const y1 = from.y + NODE_H / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_H / 2;
    const mx = (x1 + x2) / 2;

    const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;

    return (
        <path
            d={d}
            fill="none"
            stroke="#3A4657"
            strokeWidth="2"
            strokeDasharray="none"
        />
    );
}

// ── The actual Tree SVG canvas ────────────────────────────────────────────
function TreeCanvas({
    root,
    sourceType,
}: {
    root: TreeNode;
    sourceType: string;
}) {
    const { nodes, width, height } = buildLayout(root);
    const [tooltip, setTooltip] = useState<{ node: TreeNode; x: number; y: number } | null>(null);
    const PAD = 24;

    // Build a lookup map from id → node
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Build edges
    const edges: { from: LayoutNode; to: LayoutNode }[] = [];
    for (const n of nodes) {
        if (n.parentId && nodeMap.has(n.parentId)) {
            edges.push({ from: nodeMap.get(n.parentId)!, to: n });
        }
    }

    return (
        <div style={{ position: 'relative', width: width + PAD * 2, height: height + PAD * 2, minWidth: '100%' }}>
            {/* SVG for connecting lines */}
            <svg
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}
            >
                <g transform={`translate(${PAD},${PAD})`}>
                    {edges.map((e, i) => (
                        <Connector key={i} from={e.from} to={e.to} />
                    ))}
                </g>
            </svg>

            {/* Nodes */}
            {nodes.map((n) => {
                const style = TYPE_STYLE[n.node.type] || TYPE_STYLE.file;
                return (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: n.depth * 0.05 }}
                        style={{
                            position: 'absolute',
                            left: n.x + PAD,
                            top: n.y + PAD,
                            width: NODE_W,
                            height: NODE_H,
                        }}
                        onMouseEnter={(e) => {
                            if (n.node.preview) {
                                setTooltip({ node: n.node, x: n.x + PAD + NODE_W + 8, y: n.y + PAD });
                            }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: style.bg,
                                border: `2px solid ${style.border}`,
                                boxShadow: `3px 3px 0px #1A222E`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                padding: '6px 10px',
                                gap: 2,
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            {/* Glow bar at top */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0,
                                height: 2, backgroundColor: style.border, opacity: 0.6,
                            }} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: style.text, flexShrink: 0 }}>
                                    <NodeIcon type={n.node.type} sourceType={sourceType} size={12} />
                                </span>
                                <span style={{
                                    color: style.text,
                                    fontFamily: 'VT323, monospace',
                                    fontSize: n.node.type === 'root' ? 16 : 13,
                                    lineHeight: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                }}>
                                    {n.node.name}
                                </span>
                                {n.node.chunks !== undefined && (
                                    <span style={{
                                        color: style.badge,
                                        fontFamily: 'VT323, monospace',
                                        fontSize: 11,
                                        flexShrink: 0,
                                        opacity: 0.8,
                                        border: `1px solid ${style.border}`,
                                        padding: '0 3px',
                                        lineHeight: 1.4,
                                    }}>
                                        {n.node.chunks}c
                                    </span>
                                )}
                            </div>

                            {n.node.children && n.node.children.length > 0 && (
                                <div style={{
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: 9,
                                    color: style.border,
                                    opacity: 0.6,
                                    lineHeight: 1,
                                }}>
                                    {n.node.children.length} {n.node.children.length === 1 ? 'child' : 'children'}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}

            {/* Tooltip */}
            <AnimatePresence>
                {tooltip && (
                    <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        style={{
                            position: 'absolute',
                            left: tooltip.x,
                            top: tooltip.y,
                            width: 220,
                            zIndex: 100,
                            backgroundColor: '#1A2230',
                            border: '2px solid #F2AEC0',
                            padding: '10px 12px',
                            boxShadow: '4px 4px 0px #0D1520',
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{ fontFamily: 'VT323, monospace', fontSize: 11, color: '#F2AEC0', marginBottom: 6, letterSpacing: 2 }}>
                            CHUNK PREVIEW
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#8A95A5', lineHeight: 1.6 }}>
                            {tooltip.node.preview}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main Modal ─────────────────────────────────────────────────────────────
export default function KBTreeVisualization({ kbId, kbName, sourceType, token, onClose }: KBTreeVisualizationProps) {
    const [tree, setTree] = useState<TreeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTree = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:5000/api/knowledge_base/${kbId}/tree`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.error || 'Failed to load tree');
                return;
            }
            const data = await res.json();
            setTree(data.tree);
        } catch {
            setError('Network error. Could not load tree.');
        } finally {
            setLoading(false);
        }
    }, [kbId, token]);

    useEffect(() => { fetchTree(); }, [fetchTree]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-[#0D1520]/90 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-5xl h-[80vh] bg-[#141C28] border-3 border-[#3A4657] shadow-pixel-lg flex flex-col overflow-hidden"
            >
                {/* Title bar */}
                <div className="bg-[#1E2A3A] border-b-3 border-[#3A4657] px-4 py-2.5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <span className="w-3 h-3 bg-[#D88A8A] border border-[#B06060] inline-block" />
                            <span className="w-3 h-3 bg-[#D8C4A8] border border-[#B0A080] inline-block" />
                            <span className="w-3 h-3 bg-[#A8D8B0] border border-[#78B080] inline-block" />
                        </div>
                        <span className="font-pixel text-sm text-[#F2AEC0]">
                            KB TREE — {kbName.toUpperCase()}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 text-[#536175] hover:text-white transition-none">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Stats bar */}
                {tree?.meta && (
                    <div className="bg-[#F2AEC0]/5 border-b-3 border-[#3A4657] px-5 py-2 flex gap-8 flex-shrink-0">
                        {[
                            { label: 'CHUNKS', val: tree.meta.total_chunks.toLocaleString() },
                            { label: 'PAGES', val: (tree.meta.source_pages || 0).toLocaleString() },
                            { label: 'CHARS', val: tree.meta.total_chars ? `${(tree.meta.total_chars / 1000).toFixed(0)}k` : '—' },
                            { label: 'SOURCE', val: tree.meta.source_type.toUpperCase() },
                        ].map(s => (
                            <div key={s.label} className="flex flex-col">
                                <span className="font-pixel text-[9px] text-[#536175] tracking-widest">{s.label}</span>
                                <span className="font-pixel text-sm text-[#F2AEC0]">{s.val}</span>
                            </div>
                        ))}
                        <div className="ml-auto flex items-center gap-3">
                            {Object.entries({
                                root: '#F2AEC0', section: '#C4A8D8', page: '#A8D8B0',
                                directory: '#D8C4A8', file: '#536175',
                            }).map(([type, color]) => (
                                <div key={type} className="flex items-center gap-1.5">
                                    <span style={{ background: color }} className="w-2 h-2 inline-block" />
                                    <span className="font-pixel text-[9px] text-[#536175] uppercase">{type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tree body */}
                <div className="flex-1 overflow-auto p-4"
                    style={{ background: 'radial-gradient(ellipse at center, #141C28 0%, #0D1520 100%)' }}
                >
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="w-8 h-8 text-[#F2AEC0] animate-spin" />
                            <p className="font-pixel text-sm text-[#536175]">RENDERING TREE...</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                            <p className="font-pixel text-sm text-red-400">ERROR</p>
                            <p className="font-mono text-xs text-[#536175]">{error}</p>
                        </div>
                    )}
                    {!loading && !error && tree && (
                        <TreeCanvas root={tree} sourceType={sourceType} />
                    )}
                </div>

                {/* Footer */}
                <div className="border-t-3 border-[#3A4657] bg-[#1E2A3A] px-5 py-2 flex items-center justify-between flex-shrink-0">
                    <p className="font-mono text-[10px] text-[#3A4657]">Scroll to explore · Hover nodes for chunk preview</p>
                    <span className="font-pixel text-[10px] text-[#536175] animate-pixel-blink">█</span>
                </div>
            </motion.div>
        </div>
    );
}
