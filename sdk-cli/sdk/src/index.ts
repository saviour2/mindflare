// ─────────────────────────────────────────────────────────────
// @mindflare/sdk — Public API
// ─────────────────────────────────────────────────────────────

// Core client (API-key auth — for chatbot consumers)
export { Mindflare } from "./client.js";

// Admin client (JWT auth — for app/KB management)
export { MindflareAdmin } from "./admin.js";
export type { MindflareAdminConfig } from "./admin.js";

// Errors
export { MindflareError } from "./errors.js";

// Types
export type {
    MindflareConfig,
    ChatMessage,
    ChatRequestOptions,
    ChatResponse,
    TokenUsage,
    Role,
    Application,
    CreateAppOptions,
    UpdateConfigOptions,
    KnowledgeBase,
    CreateKBOptions,
    SourceType,
    KBStatus,
    AuthCredentials,
    AuthTokenResponse,
    UserProfile,
    ModelInfo,
    MindflareErrorPayload,
} from "./types.js";
