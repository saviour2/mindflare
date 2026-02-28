// ─────────────────────────────────────────────────────────────
// @mindflare/sdk — Admin Client
//
// Used for managing applications, knowledge bases, and models.
// Authenticates via JWT token (not API key).
//
// Usage:
//   import { MindflareAdmin } from "@mindflare/sdk";
//   const admin = new MindflareAdmin({ token: "jwt..." });
//   const apps = await admin.apps.list();
// ─────────────────────────────────────────────────────────────

import { MindflareError } from "./errors.js";
import type {
    Application,
    CreateAppOptions,
    UpdateConfigOptions,
    KnowledgeBase,
    CreateKBOptions,
    ModelInfo,
    AuthCredentials,
    AuthTokenResponse,
    UserProfile,
} from "./types.js";

const DEFAULT_BASE_URL = "http://localhost:5000";
const DEFAULT_TIMEOUT = 30_000;
const SDK_VERSION = "0.1.0";

// ── Internal request helper ─────────────────────────────────

interface RequestOpts {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
}

async function _request<T>(
    baseUrl: string,
    token: string | null,
    timeout: number,
    opts: RequestOpts
): Promise<T> {
    const url = `${baseUrl}${opts.path}`;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": `mindflare-sdk/${SDK_VERSION}`,
        Accept: "application/json",
        ...opts.headers,
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch(url, {
            method: opts.method,
            headers,
            body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
            signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new MindflareError({
                status: res.status,
                message: (errBody as Record<string, string>).error ?? `HTTP ${res.status}`,
                endpoint: opts.path,
            });
        }
        return (await res.json()) as T;
    } catch (error) {
        clearTimeout(timer);
        if (error instanceof MindflareError) throw error;
        throw new MindflareError({
            status: 0,
            message: `Network error: ${(error as Error).message}`,
            endpoint: opts.path,
        });
    }
}

// ── Sub-resources ───────────────────────────────────────────

class AppsResource {
    constructor(
        private baseUrl: string,
        private getToken: () => string,
        private timeout: number
    ) { }

    private req<T>(opts: RequestOpts) {
        return _request<T>(this.baseUrl, this.getToken(), this.timeout, opts);
    }

    /** List all applications owned by the authenticated user. */
    async list(): Promise<Application[]> {
        const data = await this.req<{ applications: Application[] }>({
            method: "GET",
            path: "/api/applications/",
        });
        return data.applications;
    }

    /** Get a single application by ID. */
    async get(appId: string): Promise<Application> {
        const data = await this.req<{ app: Application }>({
            method: "GET",
            path: `/api/applications/${appId}`,
        });
        return data.app;
    }

    /** Create a new application and receive the API key (shown once). */
    async create(
        opts: CreateAppOptions
    ): Promise<{ app: Application; apiKey: string }> {
        const data = await this.req<{ app: Application; api_key: string }>({
            method: "POST",
            path: "/api/applications/",
            body: {
                app_name: opts.app_name,
                model_name: opts.model_name,
            },
        });
        return { app: data.app, apiKey: data.api_key };
    }

    /** Delete an application. */
    async delete(appId: string): Promise<void> {
        await this.req({ method: "DELETE", path: `/api/applications/${appId}` });
    }

    /** Update application configuration (model, prompt, KBs, etc.). */
    async updateConfig(
        appId: string,
        config: UpdateConfigOptions
    ): Promise<void> {
        await this.req({
            method: "PUT",
            path: `/api/applications/${appId}/config`,
            body: config,
        });
    }
}

class KnowledgeBasesResource {
    constructor(
        private baseUrl: string,
        private getToken: () => string,
        private timeout: number
    ) { }

    private req<T>(opts: RequestOpts) {
        return _request<T>(this.baseUrl, this.getToken(), this.timeout, opts);
    }

    /** List all knowledge bases owned by the authenticated user. */
    async list(): Promise<KnowledgeBase[]> {
        const data = await this.req<{ knowledge_bases: KnowledgeBase[] }>({
            method: "GET",
            path: "/api/knowledge_base/",
        });
        return data.knowledge_bases;
    }

    /** Get a specific knowledge base by ID. */
    async get(kbId: string): Promise<KnowledgeBase> {
        const data = await this.req<{ knowledge_base: KnowledgeBase }>({
            method: "GET",
            path: `/api/knowledge_base/${kbId}`,
        });
        return data.knowledge_base;
    }

    /** Create a new knowledge base from a URL source (website/github). */
    async create(opts: CreateKBOptions): Promise<KnowledgeBase> {
        const data = await this.req<{ knowledge_base: KnowledgeBase }>({
            method: "POST",
            path: "/api/knowledge_base/",
            body: {
                kb_name: opts.kb_name,
                source_type: opts.source_type,
                source_url: opts.source_url,
                app_id: opts.app_id,
            },
        });
        return data.knowledge_base;
    }

    /** Delete a knowledge base and its vector index. */
    async delete(kbId: string): Promise<void> {
        await this.req({ method: "DELETE", path: `/api/knowledge_base/${kbId}` });
    }

    /**
     * Wait for a knowledge base to finish processing.
     * Polls the status every `intervalMs` until it's `completed` or `failed`.
     *
     * @param kbId     Knowledge base ID
     * @param intervalMs  Poll interval (default 2000ms)
     * @param timeoutMs   Max time to wait (default 300000ms / 5 min)
     * @param onProgress  Optional callback to receive progress updates
     */
    async waitForReady(
        kbId: string,
        opts?: {
            intervalMs?: number;
            timeoutMs?: number;
            onProgress?: (kb: KnowledgeBase) => void;
        }
    ): Promise<KnowledgeBase> {
        const interval = opts?.intervalMs ?? 2000;
        const timeout = opts?.timeoutMs ?? 300_000;
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const kb = await this.get(kbId);

            if (opts?.onProgress) opts.onProgress(kb);

            if (kb.status === "completed") return kb;
            if (kb.status === "failed") {
                throw new MindflareError({
                    status: 422,
                    message: `Knowledge base ingestion failed: ${kb.error ?? "Unknown error"}`,
                    endpoint: `/api/knowledge_base/${kbId}`,
                });
            }

            await new Promise((r) => setTimeout(r, interval));
        }

        throw new MindflareError({
            status: 408,
            message: `Timed out waiting for knowledge base ${kbId} (${timeout / 1000}s)`,
            endpoint: `/api/knowledge_base/${kbId}`,
        });
    }
}

class ModelsResource {
    constructor(
        private baseUrl: string,
        private getToken: () => string,
        private timeout: number
    ) { }

    /** List available AI models. */
    async list(): Promise<ModelInfo[]> {
        const data = await _request<{ models: ModelInfo[] }>(
            this.baseUrl,
            this.getToken(),
            this.timeout,
            { method: "GET", path: "/api/models/" }
        );
        return data.models;
    }
}

// ── Main Admin Client ───────────────────────────────────────

export interface MindflareAdminConfig {
    /** JWT token from login. If not provided, use `admin.auth.login()` first. */
    token?: string;

    /**
     * Base URL of the Mindflare API.
     * @default "http://localhost:5000"
     */
    baseUrl?: string;

    /**
     * Request timeout in milliseconds.
     * @default 30000
     */
    timeout?: number;
}

export class MindflareAdmin {
    private _token: string;
    private readonly baseUrl: string;
    private readonly timeout: number;

    /** Manage applications (CRUD, config updates). */
    readonly apps: AppsResource;

    /** Manage knowledge bases (ingest, poll progress, delete). */
    readonly knowledgeBases: KnowledgeBasesResource;

    /** Browse available AI models. */
    readonly models: ModelsResource;

    constructor(config: MindflareAdminConfig = {}) {
        this._token = config.token ?? "";
        this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
        this.timeout = config.timeout ?? DEFAULT_TIMEOUT;

        const getToken = () => this._token;

        this.apps = new AppsResource(this.baseUrl, getToken, this.timeout);
        this.knowledgeBases = new KnowledgeBasesResource(
            this.baseUrl,
            getToken,
            this.timeout
        );
        this.models = new ModelsResource(this.baseUrl, getToken, this.timeout);
    }

    /** Update the JWT token (e.g. after login). */
    setToken(token: string): void {
        this._token = token;
    }

    // ── Auth namespace ──────────────────────────────────────

    readonly auth = {
        /**
         * Register a new user account.
         *
         * @example
         * ```ts
         * await admin.auth.register({ email: "me@example.com", password: "pass1234", name: "Dev" });
         * ```
         */
        register: async (
            creds: AuthCredentials
        ): Promise<{ message: string }> => {
            return _request<{ message: string }>(
                this.baseUrl,
                null,
                this.timeout,
                {
                    method: "POST",
                    path: "/api/auth/register",
                    body: creds,
                }
            );
        },

        /**
         * Login and receive a JWT token. The token is automatically stored
         * in this admin instance for subsequent requests.
         *
         * @example
         * ```ts
         * const { token, user } = await admin.auth.login({ email: "me@example.com", password: "pass1234" });
         * // admin is now authenticated — no need to call setToken()
         * ```
         */
        login: async (
            creds: Omit<AuthCredentials, "name">
        ): Promise<AuthTokenResponse> => {
            const data = await _request<AuthTokenResponse>(
                this.baseUrl,
                null,
                this.timeout,
                {
                    method: "POST",
                    path: "/api/auth/login",
                    body: creds,
                }
            );
            this._token = data.token;
            return data;
        },

        /** Get the current user's profile. */
        me: async (): Promise<UserProfile> => {
            const data = await _request<{ user: UserProfile }>(
                this.baseUrl,
                this._token,
                this.timeout,
                { method: "GET", path: "/api/auth/me" }
            );
            return data.user;
        },
    };
}
