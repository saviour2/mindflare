// ─────────────────────────────────────────────────────────────
// @mindflare/sdk — Type Definitions
// ─────────────────────────────────────────────────────────────

/** Configuration options for the Mindflare client. */
export interface MindflareConfig {
    /** Your application API key (begins with `mf_`). */
    apiKey: string;

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

    /**
     * Maximum number of automatic retries for transient errors (5xx, network).
     * @default 2
     */
    maxRetries?: number;
}

// ── Chat ────────────────────────────────────────────────────

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
    role: Role;
    content: string;
}

export interface ChatRequestOptions {
    /** The conversation messages. */
    messages: ChatMessage[];

    /**
     * Override the model configured on the application.
     * e.g. `"meta-llama/llama-3.1-8b-instruct"`
     */
    model?: string;
}

export interface TokenUsage {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
}

export interface ChatResponse {
    /** The assistant's reply. */
    response: string;

    /** Token usage statistics (if available from the provider). */
    usage: TokenUsage;

    /** The LLM provider that served this request (`openrouter` | `groq`). */
    provider: string;

    /** Whether RAG context from a knowledge base was injected. */
    context_used: boolean;
}

// ── Application ─────────────────────────────────────────────

export interface Application {
    app_id: string;
    app_name: string;
    model_name: string;
    knowledge_base_ids: string[];
    system_prompt?: string;
    chatbot_name?: string;
    created_at: string;
    last_active?: string;
    status?: string;
}

export interface CreateAppOptions {
    app_name: string;
    model_name?: string;
}

export interface UpdateConfigOptions {
    model_name?: string;
    system_prompt?: string;
    knowledge_base_ids?: string[];
    chatbot_name?: string;
    chatbot_icon?: string;
}

// ── Knowledge Base ──────────────────────────────────────────

export type SourceType = "pdf" | "website" | "github";

export type KBStatus = "pending" | "processing" | "completed" | "failed";

export interface KnowledgeBase {
    kb_id: string;
    kb_name: string;
    source_type: SourceType;
    chunks_count: number;
    status: KBStatus;
    progress?: number;
    progress_message?: string;
    total_chars?: number;
    source_pages?: number;
    error?: string | null;
    created_at: string;
}

export interface CreateKBOptions {
    kb_name: string;
    source_type: SourceType;
    /** Required for `website` and `github` source types. */
    source_url?: string;
    /** Link the KB to an application on creation. */
    app_id?: string;
}

// ── Auth ────────────────────────────────────────────────────

export interface AuthCredentials {
    email: string;
    password: string;
    name?: string;
}

export interface AuthTokenResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
    };
}

export interface UserProfile {
    user_id: string;
    email: string;
    name: string;
    created_at: string;
}

// ── Models ──────────────────────────────────────────────────

export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
}

// ── Errors ──────────────────────────────────────────────────

export interface MindflareErrorPayload {
    status: number;
    message: string;
    endpoint: string;
}
