// ─────────────────────────────────────────────────────────────
// @mindflare/cli — Config Store
//
// Persists auth token + API URL so the user doesn't have to
// pass --token on every command.
// ─────────────────────────────────────────────────────────────

import Conf from "conf";

interface ConfigSchema {
    token: string;
    baseUrl: string;
    defaultAppId: string;
}

export const config = new Conf<ConfigSchema>({
    projectName: "mindflare",
    defaults: {
        token: "",
        baseUrl: "http://localhost:5000",
        defaultAppId: "",
    },
});

export function getToken(): string {
    return config.get("token");
}

export function getBaseUrl(): string {
    return config.get("baseUrl");
}

export function requireToken(): string {
    const t = getToken();
    if (!t) {
        console.error(
            "❌ Not authenticated. Run `mindflare login` first."
        );
        process.exit(1);
    }
    return t;
}
