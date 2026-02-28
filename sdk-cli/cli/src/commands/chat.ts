// ─────────────────────────────────────────────────────────────
// @mindflare/cli — Chat Command
//
// Supports both single-shot and interactive REPL modes.
// ─────────────────────────────────────────────────────────────

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { config, requireToken, getBaseUrl } from "../config.js";
import { api, fatal, info } from "../http.js";
import * as readline from "node:readline";

interface ChatRes {
    response: string;
    usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    provider: string;
    context_used: boolean;
}

export function registerChatCommands(program: Command) {
    program
        .command("chat")
        .description("Chat with your AI application")
        .option("--api-key <key>", "Application API key")
        .option("-m, --message <msg>", "Send a single message (non-interactive)")
        .option("-i, --interactive", "Start an interactive chat session", false)
        .action(async (opts) => {
            let apiKey = opts.apiKey;

            if (!apiKey) {
                // Try to prompt
                const answers = await inquirer.prompt([
                    {
                        type: "password",
                        name: "apiKey",
                        message: "Application API key:",
                        mask: "*",
                    },
                ]);
                apiKey = (answers as any).apiKey;
            }

            if (!apiKey) fatal("API key is required. Use --api-key or set it interactively.");

            if (opts.message && !opts.interactive) {
                // Single-shot mode
                await sendMessage(apiKey, [{ role: "user", content: opts.message }]);
                return;
            }

            // Interactive REPL
            await interactiveChat(apiKey);
        });
}

async function sendMessage(
    apiKey: string,
    messages: Array<{ role: string; content: string }>
): Promise<string> {
    const spinner = ora("Thinking...").start();

    try {
        const data = await api<ChatRes>({
            method: "POST",
            url: `${getBaseUrl()}/api/chat/`,
            token: apiKey,
            body: { messages },
        });

        spinner.stop();

        console.log();
        console.log(chalk.bold.cyan("  Assistant:"));
        console.log();

        // Wrap response text at 80 chars for readability
        const lines = data.response.split("\n");
        for (const line of lines) {
            console.log(`  ${line}`);
        }

        console.log();
        if (data.usage.total_tokens) {
            console.log(
                chalk.dim(
                    `  [${data.provider} · ${data.usage.total_tokens} tokens${data.context_used ? " · RAG" : ""
                    }]`
                )
            );
        }
        console.log();

        return data.response;
    } catch (e) {
        spinner.stop();
        fatal((e as Error).message);
    }
}

async function interactiveChat(apiKey: string) {
    console.log();
    console.log(
        chalk.bold.cyan("  Mindflare AI — Interactive Chat")
    );
    console.log(chalk.dim("  Type your message and press Enter. Use /quit to exit.\n"));

    const history: Array<{ role: string; content: string }> = [];

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.green("  You: "),
    });

    rl.prompt();

    rl.on("line", async (line) => {
        const input = line.trim();

        if (!input) {
            rl.prompt();
            return;
        }

        if (input === "/quit" || input === "/exit" || input === "/q") {
            console.log(chalk.dim("\n  Goodbye! 👋\n"));
            rl.close();
            process.exit(0);
        }

        if (input === "/clear") {
            history.length = 0;
            console.log(chalk.dim("  Context cleared.\n"));
            rl.prompt();
            return;
        }

        history.push({ role: "user", content: input });

        const spinner = ora({ text: "Thinking...", indent: 2 }).start();

        try {
            const data = await api<ChatRes>({
                method: "POST",
                url: `${getBaseUrl()}/api/chat/`,
                token: apiKey,
                body: { messages: history },
            });

            spinner.stop();
            history.push({ role: "assistant", content: data.response });

            console.log();
            const lines = data.response.split("\n");
            for (const line of lines) {
                console.log(chalk.cyan(`  ${line}`));
            }
            if (data.usage.total_tokens) {
                console.log(
                    chalk.dim(
                        `  [${data.usage.total_tokens} tokens${data.context_used ? " · RAG" : ""
                        }]`
                    )
                );
            }
            console.log();
        } catch (e) {
            spinner.stop();
            console.log(chalk.red(`  Error: ${(e as Error).message}\n`));
        }

        rl.prompt();
    });

    rl.on("close", () => process.exit(0));
}
