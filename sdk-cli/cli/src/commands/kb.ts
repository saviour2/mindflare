// ─────────────────────────────────────────────────────────────
// @mindflare/cli — Knowledge Base Commands
// ─────────────────────────────────────────────────────────────

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { requireToken, getBaseUrl } from "../config.js";
import { api, fatal, success, info } from "../http.js";

interface KBDoc {
    kb_id: string;
    kb_name: string;
    source_type: string;
    chunks_count: number;
    status: string;
    progress?: number;
    progress_message?: string;
    error?: string;
}

export function registerKBCommands(program: Command) {
    const kb = program
        .command("kb")
        .description("Manage knowledge bases");

    // ── List ───────────────────────────────────────
    kb.command("list")
        .alias("ls")
        .description("List all knowledge bases")
        .action(async () => {
            const token = requireToken();
            try {
                const data = await api<{ knowledge_bases: KBDoc[] }>({
                    method: "GET",
                    url: `${getBaseUrl()}/api/knowledge_base/`,
                    token,
                });

                if (!data.knowledge_bases.length) {
                    info("No knowledge bases yet. Create one with `mindflare kb create`.");
                    return;
                }

                console.log();
                console.log(
                    chalk.bold(
                        `  ${"NAME".padEnd(28)} ${"TYPE".padEnd(10)} ${"STATUS".padEnd(12)} ${"CHUNKS".padEnd(8)} ID`
                    )
                );
                console.log(chalk.dim("  " + "─".repeat(95)));

                for (const k of data.knowledge_bases) {
                    const statusColor =
                        k.status === "completed"
                            ? chalk.green
                            : k.status === "failed"
                                ? chalk.red
                                : chalk.yellow;

                    console.log(
                        `  ${chalk.white(k.kb_name.padEnd(28))} ${chalk.cyan(
                            k.source_type.padEnd(10)
                        )} ${statusColor(k.status.padEnd(12))} ${chalk.yellow(
                            String(k.chunks_count || 0).padEnd(8)
                        )} ${chalk.dim(k.kb_id)}`
                    );
                }
                console.log();
            } catch (e) {
                fatal((e as Error).message);
            }
        });

    // ── Create from URL ────────────────────────────
    kb.command("create")
        .description("Create a new knowledge base from a URL source")
        .requiredOption("-n, --name <name>", "Knowledge base name")
        .requiredOption(
            "-t, --type <type>",
            "Source type: website | github"
        )
        .requiredOption("-u, --url <url>", "Source URL")
        .option("--app <appId>", "Link to an application on creation")
        .option("-w, --wait", "Wait for ingestion to complete", false)
        .action(async (opts) => {
            const token = requireToken();

            if (!["website", "github"].includes(opts.type)) {
                fatal("Source type must be 'website' or 'github'. Use the dashboard for PDF uploads.");
            }

            try {
                const data = await api<{ knowledge_base: KBDoc }>({
                    method: "POST",
                    url: `${getBaseUrl()}/api/knowledge_base/`,
                    token,
                    body: {
                        kb_name: opts.name,
                        source_type: opts.type,
                        source_url: opts.url,
                        app_id: opts.app,
                    },
                });

                const kbId = data.knowledge_base.kb_id;
                success(`Knowledge base "${opts.name}" created (${chalk.dim(kbId)})`);

                if (opts.wait) {
                    await waitForIngestion(kbId, token);
                } else {
                    info("Ingestion is running in the background.");
                    info(`Track progress: ${chalk.bold(`mindflare kb status ${kbId}`)}`);
                }
            } catch (e) {
                fatal((e as Error).message);
            }
        });

    // ── Status ─────────────────────────────────────
    kb.command("status <kbId>")
        .description("Check ingestion status of a knowledge base")
        .option("-w, --wait", "Watch until completion", false)
        .action(async (kbId: string, opts) => {
            const token = requireToken();

            if (opts.wait) {
                await waitForIngestion(kbId, token);
                return;
            }

            try {
                const data = await api<{ knowledge_base: KBDoc }>({
                    method: "GET",
                    url: `${getBaseUrl()}/api/knowledge_base/${kbId}`,
                    token,
                });
                const k = data.knowledge_base;

                console.log();
                console.log(`  ${chalk.bold("Name:")}     ${k.kb_name}`);
                console.log(`  ${chalk.bold("Type:")}     ${k.source_type}`);
                console.log(`  ${chalk.bold("Status:")}   ${k.status}`);
                if (k.progress !== undefined) {
                    console.log(`  ${chalk.bold("Progress:")} ${k.progress}%`);
                }
                if (k.progress_message) {
                    console.log(`  ${chalk.bold("Stage:")}    ${k.progress_message}`);
                }
                if (k.status === "completed") {
                    console.log(`  ${chalk.bold("Chunks:")}   ${k.chunks_count}`);
                }
                if (k.error) {
                    console.log(`  ${chalk.bold.red("Error:")}    ${k.error}`);
                }
                console.log(`  ${chalk.bold("ID:")}       ${chalk.dim(k.kb_id)}`);
                console.log();
            } catch (e) {
                fatal((e as Error).message);
            }
        });

    // ── Delete ─────────────────────────────────────
    kb.command("delete <kbId>")
        .description("Delete a knowledge base")
        .action(async (kbId: string) => {
            const token = requireToken();
            try {
                await api({
                    method: "DELETE",
                    url: `${getBaseUrl()}/api/knowledge_base/${kbId}`,
                    token,
                });
                success(`Knowledge base ${kbId} deleted.`);
            } catch (e) {
                fatal((e as Error).message);
            }
        });
}

// ── Helper: poll until done ──────────────────────────────────

async function waitForIngestion(kbId: string, token: string) {
    const spinner = ora("Waiting for ingestion...").start();

    const MAX_WAIT = 5 * 60 * 1000; // 5 min
    const start = Date.now();

    while (Date.now() - start < MAX_WAIT) {
        try {
            const data = await api<{ knowledge_base: KBDoc }>({
                method: "GET",
                url: `${getBaseUrl()}/api/knowledge_base/${kbId}`,
                token,
            });
            const k = data.knowledge_base;

            if (k.status === "completed") {
                spinner.succeed(
                    chalk.green(`Ingestion complete — ${k.chunks_count} chunks created`)
                );
                return;
            }

            if (k.status === "failed") {
                spinner.fail(chalk.red(`Ingestion failed: ${k.error ?? "Unknown"}`));
                return;
            }

            const pct = k.progress ?? 0;
            const msg = k.progress_message ?? "Processing...";
            spinner.text = `${chalk.yellow(`${pct}%`)} ${msg}`;
        } catch {
            // Retry on transient errors
        }

        await new Promise((r) => setTimeout(r, 2000));
    }

    spinner.fail("Timed out waiting for ingestion (5 min)");
}
