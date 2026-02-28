// ─────────────────────────────────────────────────────────────
// @mindflare/sdk — Core Client
//
// Usage:
//   import { Mindflare } from "@mindflare/sdk";
//   const mf = new Mindflare({ apiKey: "mf_..." });
//   const reply = await mf.chat({ messages: [{ role: "user", content: "hi" }] });
// ─────────────────────────────────────────────────────────────

import { MindflareError } from "./errors.js";
import type {
    MindflareConfig,
    ChatRequestOptions,
    ChatResponse,
    ChatMessage,
} from "./types.js";

const DEFAULT_BASE_URL = "http://localhost:5000";
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const SDK_VERSION = "0.1.0";

// ── Internal HTTP helper ────────────────────────────────────

interface RequestOpts {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
}

export class Mindflare {
    private readonly apiKey: string;
    private readonly appId?: string;
    private readonly baseUrl: string;
    private readonly timeout: number;
    private readonly maxRetries: number;

    constructor(config: MindflareConfig & { appId?: string }) {
        if (!config.apiKey) {
            throw new Error(
                "Mindflare: apiKey (client secret) is required. Get yours at https://app.mindflare.ai"
            );
        }
        this.apiKey = config.apiKey;
        this.appId = config.appId;
        this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
        this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
        this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    }

    /**
     * Integrate a pre-built Chat Widget into your website with one line of code.
     * 
     * @example
     * ```ts
     * mf.mountChat("#chat-container");
     * ```
     */
    mountChat(containerSelector: string, options: {
        width?: string;
        height?: string;
        appId?: string; // Optional override
    } = {}) {
        if (typeof window === 'undefined') {
            throw new Error("mountChat can only be used in browser environments.");
        }

        const targetAppId = options.appId || this.appId;
        if (!targetAppId) {
            throw new Error("appId is required to mount the chat widget. Provide it in constructor or options.");
        }

        const container = document.querySelector(containerSelector);
        if (!container) throw new Error(`Container ${containerSelector} not found`);

        const iframe = document.createElement('iframe');
        const widgetBaseUrl = this.baseUrl.replace(/\/api$/, "").replace(":5000", ":3000"); // Map backend to frontend for dev

        iframe.src = `${widgetBaseUrl}/widget/${targetAppId}?secret=${this.apiKey}`;
        iframe.style.width = options.width || "100%";
        iframe.style.height = options.height || "600px";
        iframe.style.border = "none";
        iframe.style.borderRadius = "12px";
        iframe.style.boxShadow = "0 20px 50px rgba(0,0,0,0.3)";
        iframe.style.backgroundColor = "transparent";

        container.appendChild(iframe);
    }

    // ─────────────────────────────────────────────────────────
    // Chat
    // ─────────────────────────────────────────────────────────

    /**
     * Send a chat completion request.
     *
     * @example
     * ```ts
     * const reply = await mf.chat({
     *   messages: [
     *     { role: "system", content: "You are a helpful assistant." },
     *     { role: "user", content: "What is RAG?" },
     *   ],
     * });
     * console.log(reply.response);
     * ```
     */
    async chat(options: ChatRequestOptions): Promise<ChatResponse> {
        if (!options.messages?.length) {
            throw new Error("Mindflare.chat(): messages array cannot be empty");
        }

        const body: Record<string, unknown> = {
            messages: options.messages,
        };
        if (options.model) {
            body.model = options.model;
        }

        return this._request<ChatResponse>({
            method: "POST",
            path: "/api/chat/",
            body,
        });
    }

    // ─────────────────────────────────────────────────────────
    // Convenience helpers
    // ─────────────────────────────────────────────────────────

    /**
     * Send a single user message and get the assistant reply as a string.
     *
     * @example
     * ```ts
     * const answer = await mf.ask("Explain quantum computing in one sentence.");
     * ```
     */
    async ask(
        question: string,
        opts?: { systemPrompt?: string }
    ): Promise<string> {
        const messages: ChatMessage[] = [];
        if (opts?.systemPrompt) {
            messages.push({ role: "system", content: opts.systemPrompt });
        }
        messages.push({ role: "user", content: question });
        const res = await this.chat({ messages });
        return res.response;
    }

    // ─────────────────────────────────────────────────────────
    // Internal HTTP
    // ─────────────────────────────────────────────────────────

    private async _request<T>(opts: RequestOpts): Promise<T> {
        const url = `${this.baseUrl}${opts.path}`;
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "User-Agent": `mindflare-sdk/${SDK_VERSION}`,
            Accept: "application/json",
            ...opts.headers,
        };

        const fetchOpts: RequestInit & { signal?: AbortSignal } = {
            method: opts.method,
            headers,
        };
        if (opts.body !== undefined) {
            fetchOpts.body = JSON.stringify(opts.body);
        }

        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                opts.timeout ?? this.timeout
            );
            fetchOpts.signal = controller.signal;

            try {
                const response = await fetch(url, fetchOpts);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    const msg =
                        (errorBody as Record<string, string>).error ??
                        `HTTP ${response.status}`;
                    const err = new MindflareError({
                        status: response.status,
                        message: msg,
                        endpoint: opts.path,
                    });

                    // Only retry on 5xx
                    if (err.isRetryable && attempt < this.maxRetries) {
                        lastError = err;
                        await this._backoff(attempt);
                        continue;
                    }
                    throw err;
                }

                return (await response.json()) as T;
            } catch (error) {
                clearTimeout(timeoutId);

                if (error instanceof MindflareError) throw error;

                // Network / timeout error — retry if allowed
                if (attempt < this.maxRetries) {
                    lastError = error as Error;
                    await this._backoff(attempt);
                    continue;
                }

                throw new MindflareError({
                    status: 0,
                    message: `Network error: ${(error as Error).message}`,
                    endpoint: opts.path,
                });
            }
        }

        throw lastError ?? new Error("Unexpected retry exhaustion");
    }

    /** Exponential backoff: 500ms, 1500ms, 3500ms … */
    private _backoff(attempt: number): Promise<void> {
        const ms = Math.min(500 * Math.pow(2, attempt), 10_000);
        return new Promise((r) => setTimeout(r, ms));
    }
}
