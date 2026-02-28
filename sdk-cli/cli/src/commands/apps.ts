// ─────────────────────────────────────────────────────────────
// @mindflare/cli — Apps Commands
// ─────────────────────────────────────────────────────────────

import { Command } from "commander";
import chalk from "chalk";
import { config, requireToken, getBaseUrl } from "../config.js";
import { api, fatal, success, info } from "../http.js";

interface AppDoc {
    app_id: string;
    app_name: string;
    model_name: string;
    knowledge_base_ids: string[];
    created_at: string;
}

export function registerAppsCommands(program: Command) {
    const apps = program
        .command("apps")
        .description("Manage applications");

    // ── List ───────────────────────────────────────
    apps
        .command("list")
        .alias("ls")
        .description("List all applications")
        .action(async () => {
            const token = requireToken();
            try {
                const data = await api<{ applications: AppDoc[] }>({
                    method: "GET",
                    url: `${getBaseUrl()}/api/applications/`,
                    token,
                });

                if (!data.applications.length) {
                    info("No applications yet. Create one with `mindflare apps create`.");
                    return;
                }

                console.log();
                console.log(
                    chalk.bold(
                        `  ${"NAME".padEnd(24)} ${"MODEL".padEnd(36)} ${"KBs".padEnd(5)} ID`
                    )
                );
                console.log(chalk.dim("  " + "─".repeat(90)));

                for (const app of data.applications) {
                    const kbCount = (app.knowledge_base_ids?.length ?? 0).toString();
                    console.log(
                        `  ${chalk.white(app.app_name.padEnd(24))} ${chalk.cyan(
                            app.model_name.padEnd(36)
                        )} ${chalk.yellow(kbCount.padEnd(5))} ${chalk.dim(app.app_id)}`
                    );
                }
                console.log();
            } catch (e) {
                fatal((e as Error).message);
            }
        });

    // ── Create ─────────────────────────────────────
    apps
        .command("create")
        .description("Create a new application")
        .requiredOption("-n, --name <name>", "Application name")
        .option("-m, --model <model>", "Model ID", "meta-llama/llama-3.1-8b-instruct:free")
        .action(async (opts) => {
            const token = requireToken();
            try {
                const data = await api<{ app: AppDoc; api_key: string }>({
                    method: "POST",
                    url: `${getBaseUrl()}/api/applications/`,
                    token,
                    body: { app_name: opts.name, model_name: opts.model },
                });

                success(`Application "${data.app.app_name}" created!`);
                console.log(
                    chalk.yellow(
                        "  ⚠  Save this API key — it will NOT be shown again:\n"
                    )
                );
                console.log(`  ${chalk.bold.green(data.api_key)}\n`);
                console.log(chalk.dim(`  App ID: ${data.app.app_id}`));
                console.log();

                config.set("defaultAppId", data.app.app_id);
                info(`Default app set to ${data.app.app_id}`);
                console.log();
            } catch (e) {
                fatal((e as Error).message);
            }
        });

    // ── Delete ─────────────────────────────────────
    apps
        .command("delete <appId>")
        .description("Delete an application")
        .action(async (appId: string) => {
            const token = requireToken();
            try {
                await api({
                    method: "DELETE",
                    url: `${getBaseUrl()}/api/applications/${appId}`,
                    token,
                });
                success(`Application ${appId} deleted.`);
            } catch (e) {
                fatal((e as Error).message);
            }
        });

    // ── Info ───────────────────────────────────────
    apps
        .command("info <appId>")
        .description("Get details of an application")
        .action(async (appId: string) => {
            const token = requireToken();
            try {
                const data = await api<{ app: AppDoc & Record<string, unknown> }>({
                    method: "GET",
                    url: `${getBaseUrl()}/api/applications/${appId}`,
                    token,
                });
                const a = data.app;
                console.log();
                console.log(`  ${chalk.bold("Name:")}   ${a.app_name}`);
                console.log(`  ${chalk.bold("Model:")}  ${a.model_name}`);
                console.log(`  ${chalk.bold("KBs:")}    ${(a.knowledge_base_ids || []).join(", ") || chalk.dim("none")}`);
                console.log(`  ${chalk.bold("ID:")}     ${chalk.dim(a.app_id)}`);
                console.log();
            } catch (e) {
                fatal((e as Error).message);
            }
        });

    // ── Use (set default) ─────────────────────────
    apps
        .command("use <appId>")
        .description("Set the default application for CLI commands")
        .action((appId: string) => {
            config.set("defaultAppId", appId);
            success(`Default application set to ${appId}`);
        });
}
