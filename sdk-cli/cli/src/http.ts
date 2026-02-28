// ─────────────────────────────────────────────────────────────
// @mindflare/cli — HTTP helpers
//
// Lightweight fetch wrapper so CLI commands stay clean.
// ─────────────────────────────────────────────────────────────

import chalk from "chalk";

interface ReqOpts {
    method: "GET" | "POST" | "PUT" | "DELETE";
    url: string;
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
}

export async function api<T>(opts: ReqOpts): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...opts.headers,
    };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

    const res = await fetch(opts.url, {
        method: opts.method,
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const msg = (data as Record<string, string>).error ?? `HTTP ${res.status}`;
        throw new Error(msg);
    }

    return data as T;
}

export function fatal(msg: string): never {
    console.error(chalk.red(`\n  ✗ ${msg}\n`));
    process.exit(1);
}

export function success(msg: string): void {
    console.log(chalk.green(`\n  ✓ ${msg}\n`));
}

export function info(msg: string): void {
    console.log(chalk.cyan(`  ℹ ${msg}`));
}
