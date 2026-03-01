// ─────────────────────────────────────────────────────────────
// @mindflare/cli — Entry Point
//
//   mindflare login              — Authenticate
//   mindflare whoami             — Show current user
//   mindflare apps list          — List applications
//   mindflare apps create        — Create a new app
//   mindflare kb list            — List knowledge bases
//   mindflare kb create          — Ingest a new source
//   mindflare chat               — Interactive chat session
//   mindflare chat -m "hi"       — Single-shot message
// ─────────────────────────────────────────────────────────────

import { Command } from "commander";
import chalk from "chalk";
import { registerAuthCommands } from "./commands/auth.js";
import { registerAppsCommands } from "./commands/apps.js";
import { registerKBCommands } from "./commands/kb.js";
import { registerChatCommands } from "./commands/chat.js";
import { registerWhatsappCommands } from "./commands/whatsapp.js";

const VERSION = "0.1.0";

const program = new Command();

program
    .name("mindflare")
    .version(VERSION)
    .description(
        chalk.bold.cyan("Mindflare AI") +
        chalk.dim(" — Build, manage, and deploy AI chatbots from the terminal")
    );

// Register all command groups
registerAuthCommands(program);
registerAppsCommands(program);
registerKBCommands(program);
registerChatCommands(program);
registerWhatsappCommands(program);

// ── Config command ──────────────────────────────

import { config } from "./config.js";

program
    .command("config")
    .description("View or update CLI configuration")
    .option("--set-url <url>", "Set the API base URL")
    .option("--show", "Show current configuration", false)
    .action((opts) => {
        if (opts.setUrl) {
            config.set("baseUrl", opts.setUrl);
            console.log(chalk.green(`\n  ✓ API URL set to ${opts.setUrl}\n`));
            return;
        }

        // Default: show config
        console.log();
        console.log(`  ${chalk.bold("API URL:")}     ${config.get("baseUrl")}`);
        console.log(
            `  ${chalk.bold("Auth:")}        ${config.get("token") ? chalk.green("Authenticated") : chalk.red("Not authenticated")
            }`
        );
        console.log(
            `  ${chalk.bold("Default App:")} ${config.get("defaultAppId") || chalk.dim("none")
            }`
        );
        console.log(
            `  ${chalk.bold("Config path:")} ${chalk.dim(config.path)}`
        );
        console.log();
    });

// Parse
program.parse(process.argv);

// Show help if no args
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
