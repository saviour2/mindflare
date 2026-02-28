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
        .description("Authenticate with the Mindflare platform")
        .option("-e, --email <email>", "Account email")
        .option("-p, --password <password>", "Account password")
        .option("--api-url <url>", "API base URL", config.get("baseUrl"))
        .action(async (opts) => {
            const baseUrl = opts.apiUrl;
            config.set("baseUrl", baseUrl);

            let email = opts.email;
            let password = opts.password;

            if (!email || !password) {
                const answers = await inquirer.prompt([
                    ...(!email
                        ? [{ type: "input", name: "email", message: "Email:" }]
                        : []),
                    ...(!password
                        ? [
                            {
                                type: "password",
                                name: "password",
                                message: "Password:",
                                mask: "*",
                            },
                        ]
                        : []),
                ]);
                email = email || answers.email;
                password = password || answers.password;
            }

            try {
                const data = await api<{
                    token: string;
                    user: { name: string; email: string };
                }>({
                    method: "POST",
                    url: `${baseUrl}/api/auth/login`,
                    body: { email, password },
                });

                config.set("token", data.token);
                success(`Logged in as ${chalk.bold(data.user.name)} (${data.user.email})`);
            } catch (e) {
                fatal((e as Error).message);
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
                const answers = await inquirer.prompt([
                    ...(!name
                        ? [{ type: "input", name: "name", message: "Your name:" }]
                        : []),
                    ...(!email
                        ? [{ type: "input", name: "email", message: "Email:" }]
                        : []),
                    ...(!password
                        ? [
                            {
                                type: "password",
                                name: "password",
                                message: "Password (min 8 chars):",
                                mask: "*",
                            },
                        ]
                        : []),
                ]);
                name = name || answers.name;
                email = email || answers.email;
                password = password || answers.password;
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
                    user: { user_id: string; email: string; name: string };
                }>({
                    method: "GET",
                    url: `${config.get("baseUrl")}/api/auth/me`,
                    token,
                });
                const u = data.user;
                console.log();
                console.log(`  ${chalk.bold("Name:")}  ${u.name}`);
                console.log(`  ${chalk.bold("Email:")} ${u.email}`);
                console.log(`  ${chalk.bold("ID:")}    ${chalk.dim(u.user_id)}`);
                info(`API: ${config.get("baseUrl")}`);
                console.log();
            } catch (e) {
                fatal((e as Error).message);
            }
        });
}
