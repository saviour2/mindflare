// ─────────────────────────────────────────────────────────────
// @mindflare/sdk — Custom Error Class
// ─────────────────────────────────────────────────────────────

import type { MindflareErrorPayload } from "./types.js";

export class MindflareError extends Error {
    /** HTTP status code (e.g., 401, 404, 500). */
    readonly status: number;

    /** The API endpoint that was called. */
    readonly endpoint: string;

    constructor({ status, message, endpoint }: MindflareErrorPayload) {
        super(message);
        this.name = "MindflareError";
        this.status = status;
        this.endpoint = endpoint;

        // Maintains proper stack trace in V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MindflareError);
        }
    }

    /** True for server-side errors (5xx) that may be worth retrying. */
    get isRetryable(): boolean {
        return this.status >= 500;
    }

    /** True if the request failed due to invalid/expired credentials. */
    get isAuthError(): boolean {
        return this.status === 401 || this.status === 403;
    }
}
