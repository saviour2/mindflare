// ─────────────────────────────────────────────────────────────
// @mindflare/cli — Auth Commands
// ─────────────────────────────────────────────────────────────

import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import { config } from "../config.js";
import { api, fatal, success, info } from "../http.js";

export function registerAuthCommands(program: Command) {
    // ── Login ──────────────────────────────────────
    program
        .command("login")
        .description("Authenticate with a CLI token from the Mindflare dashboard")
        .option("-t, --token <token>", "CLI Access Token")
        .option("--api-url <url>", "API base URL", config.get("baseUrl"))
        .action(async (opts) => {
            const baseUrl = opts.apiUrl;
            config.set("baseUrl", baseUrl);

            let token = opts.token;

            if (!token) {
                console.log(chalk.cyan("\n🔑 To get your CLI token:"));
                console.log(chalk.dim("   1. Go to your Mindflare dashboard"));
                console.log(chalk.dim("   2. Navigate to Settings"));
                console.log(chalk.dim("   3. Copy your CLI Access Token\n"));

                const answers = await inquirer.prompt([
                    {
                        type: "password",
                        name: "token",
                        message: "Paste your CLI Token:",
                        mask: "*",
                    },
                ]);
                token = (answers as any).token;
            }

            if (!token || !token.trim()) {
                fatal("No token provided. Login cancelled.");
                return;
            }

            token = token.trim();
            config.set("token", token);

            try {
                // Verify token works and fetch user details
                const data = await api<{
                    user: { id: string; name: string; email: string; client_secret: string };
                }>({
                    method: "GET",
                    url: `${baseUrl}/api/auth/me`,
                    token,
                });
                config.set("clientSecret", data.user.client_secret);
                success(`Logged in as ${chalk.bold(data.user.name)} (${data.user.email})`);
            } catch (e) {
                config.set("token", ""); // Invalid token, clear it
                fatal("Invalid CLI token. Please check and try again.");
            }
        });

    // ── Register ───────────────────────────────────
    program
        .command("register")
        .description("Create a new Mindflare account")
        .option("-e, --email <email>", "Account email")
        .option("-p, --password <password>", "Account password")
        .option("-n, --name <name>", "Your name")
        .option("--api-url <url>", "API base URL", config.get("baseUrl"))
        .action(async (opts) => {
            const baseUrl = opts.apiUrl;

            let { email, password, name } = opts;

            if (!email || !password || !name) {
                const questions: any[] = [];
                if (!name) {
                    questions.push({ type: "input", name: "name", message: "Your name:" });
                }
                if (!email) {
                    questions.push({ type: "input", name: "email", message: "Email:" });
                }
                if (!password) {
                    questions.push({
                        type: "password",
                        name: "password",
                        message: "Password (min 8 chars):",
                        mask: "*",
                    });
                }

                const answers = await inquirer.prompt(questions);
                name = name || (answers as any).name;
                email = email || (answers as any).email;
                password = password || (answers as any).password;
            }

            try {
                await api({
                    method: "POST",
                    url: `${baseUrl}/api/auth/register`,
                    body: { email, password, name },
                });
                success("Account created! Run `mindflare login` to authenticate.");
            } catch (e) {
                fatal((e as Error).message);
            }
        });

    // ── Logout ─────────────────────────────────────
    program
        .command("logout")
        .description("Clear saved authentication")
        .action(() => {
            config.set("token", "");
            config.set("clientSecret", "");
            config.set("defaultAppId", "");
            success("Logged out. Config cleared.");
        });

    // ── Whoami ─────────────────────────────────────
    program
        .command("whoami")
        .description("Display the current authenticated user")
        .action(async () => {
            const token = config.get("token");
            if (!token) return fatal("Not authenticated. Run `mindflare login`.");

            try {
                const data = await api<{
                    user: { user_id: string; email: string; name: string; client_secret: string };
                }>({
                    method: "GET",
                    url: `${config.get("baseUrl")}/api/auth/me`,
                    token,
                });
                const u = data.user;
                console.log();
                console.log(`  ${chalk.bold("Name:")}   ${u.name}`);
                console.log(`  ${chalk.bold("Email:")}  ${u.email}`);
                console.log(`  ${chalk.bold("ID:")}     ${chalk.dim(u.user_id)}`);
                console.log(`  ${chalk.bold("Secret:")} ${chalk.yellow(u.client_secret)}`);
                info(`API: ${config.get("baseUrl")}`);
                console.log();
            } catch (e) {
                fatal((e as Error).message);
            }
        });
}
