// ─────────────────────────────────────────────────────────────
// @mindflare/cli — WhatsApp Bot Command
//
//   mindflare whatsapp              — Start WhatsApp bot for an app
// ─────────────────────────────────────────────────────────────

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { config, requireToken, getBaseUrl } from "../config.js";
import { api, fatal, info } from "../http.js";

// Baileys and QR code imports
// We use dynamic imports for Baileys to avoid slowing down other CLI commands
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;
const MAX_HISTORY_TURNS = 40; // Keep last 40 messages (20 user + 20 assistant) per conversation

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────
// In-memory conversation buffer (per phone number)
// Works like LangChain's ConversationBufferWindowMemory
// ─────────────────────────────────────────────
class ConversationMemory {
    private conversations: Map<string, Array<{ role: string; content: string }>> = new Map();

    /** Add a message to a conversation */
    addMessage(conversationId: string, role: string, content: string) {
        if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, []);
        }
        const history = this.conversations.get(conversationId)!;
        history.push({ role, content });

        // Trim to window size to avoid token overrun
        if (history.length > MAX_HISTORY_TURNS) {
            // Keep the most recent messages
            this.conversations.set(conversationId, history.slice(-MAX_HISTORY_TURNS));
        }
    }

    /** Get full message history for a conversation */
    getHistory(conversationId: string): Array<{ role: string; content: string }> {
        return this.conversations.get(conversationId) || [];
    }

    /** Get number of active conversations */
    get size(): number {
        return this.conversations.size;
    }
}

async function startWhatsAppBot(appId: string) {
    const baileys = await import('@whiskeysockets/baileys');
    const makeWASocket = baileys.default;
    const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;
    const { default: qrcode } = await import('qrcode-terminal');

    // Conversation memory — persists across reconnections
    const memory = new ConversationMemory();

    // Deduplication — track processed message IDs to avoid double-replies
    const processedMsgIds = new Set<string>();
    const MAX_PROCESSED_CACHE = 500;

    // Lock per conversation to prevent concurrent replies to the same chat
    const activeLocks = new Set<string>();

    // Silent logger to suppress all Baileys internal logging
    const silentLogger = {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
        trace: () => {},
        fatal: () => {},
        child: () => silentLogger,
        level: 'silent',
    };

    let retryCount = 0;

    async function connectSocket() {
        const { state, saveCreds } = await useMultiFileAuthState(`baileys_auth_info_${appId}`);
        const { version } = await fetchLatestBaileysVersion();

        console.log();
        console.log(chalk.dim(`Using WA v${version.join('.')}`));
        const spinner = ora('Initializing WhatsApp connection...').start();

        const sock = (makeWASocket as any)({
            auth: state,
            version,
            logger: silentLogger,
            browser: ['Mindflare', 'Chrome', '120.0.0'],
            connectTimeoutMs: 60_000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 25_000,
            emitOwnEvents: false,
            generateHighQualityLinkPreview: false,
        });

        sock.ev.on('connection.update', async (update: any) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                spinner.stop();
                retryCount = 0; // Reset retries when we get a QR — server is reachable
                console.log(chalk.bold.cyan("\n📱 Scan this QR code with WhatsApp to connect your bot:\n"));
                qrcode.generate(qr, { small: true });
                console.log(chalk.dim("\nOpen WhatsApp → Settings → Linked Devices → Link a Device\n"));
            }

            if (connection === 'close') {
                spinner.stop();
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    retryCount++;
                    if (retryCount > MAX_RETRIES) {
                        console.log(chalk.red(`\n❌ Failed to connect after ${MAX_RETRIES} attempts.`));
                        console.log(chalk.yellow("Tips:"));
                        console.log(chalk.dim("  • Delete the auth folder and try again:"));
                        console.log(chalk.dim(`    rm -rf baileys_auth_info_${appId}`));
                        console.log(chalk.dim("  • Make sure you have a stable internet connection"));
                        process.exit(1);
                    }
                    console.log(chalk.yellow(`Connection closed (status ${statusCode ?? 'unknown'}). Retrying in ${RETRY_DELAY_MS / 1000}s... (${retryCount}/${MAX_RETRIES})`));
                    await delay(RETRY_DELAY_MS);
                    connectSocket();
                } else {
                    console.log(chalk.red("\nConnection closed. You logged out."));
                    console.log(chalk.dim(`Delete baileys_auth_info_${appId} and run again to re-link.`));
                    process.exit(0);
                }
            } else if (connection === 'open') {
                spinner.stop();
                retryCount = 0;
                console.log(chalk.bold.green("\n✅ WhatsApp Bot is now ONLINE and ready to reply!"));
                console.log(chalk.dim("Press Ctrl+C to stop the bot.\n"));
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m: any) => {
            // Only process genuinely new incoming messages (type 'notify')
            if (m.type !== 'notify') return;

            for (const msg of m.messages) {
            // Skip our own messages and status updates
            if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;

            // Only respond to personal (DM) messages — ignore groups
            if (msg.key.remoteJid.endsWith('@g.us')) return;

            // Deduplicate: skip if we already processed this exact message
            const msgId = msg.key.id;
            if (!msgId || processedMsgIds.has(msgId)) return;
            processedMsgIds.add(msgId);
            // Evict old entries to avoid unbounded memory growth
            if (processedMsgIds.size > MAX_PROCESSED_CACHE) {
                const first = processedMsgIds.values().next().value;
                if (first) processedMsgIds.delete(first);
            }

            // Extract text message
            const messageType = Object.keys(msg.message)[0];
            let textContent = '';

            if (messageType === 'conversation') {
                textContent = msg.message.conversation;
            } else if (messageType === 'extendedTextMessage') {
                textContent = msg.message.extendedTextMessage.text;
            }

            if (!textContent) return;

            // Prevent concurrent processing for the same chat
            const jid = msg.key.remoteJid;
            if (activeLocks.has(jid)) return;
            activeLocks.add(jid);

            console.log(chalk.cyan(`\n[User] `) + textContent);

            // Let user know we are typing
            await sock.sendPresenceUpdate('composing', jid);

            try {
                const token = requireToken();
                const clientSecret = config.get("clientSecret") as string;

                // Format phone number to use as conversation ID
                const convId = `whatsapp-${jid.split('@')[0]}`;

                // Add user message to conversation memory
                memory.addMessage(convId, "user", textContent);

                // Get full conversation history for this phone number
                const conversationHistory = memory.getHistory(convId);

                // We use the playground endpoint since it doesn't require an API key, just JWT token.
                // This allows seamless integration for the app owner.
                const data = await api<any>({
                    method: "POST",
                    url: `${getBaseUrl()}/api/chat/playground/${appId}`,
                    token,
                    body: {
                        messages: conversationHistory,
                        conversation_id: convId
                    },
                });

                const reply = data.response;

                // Add assistant response to memory so it's included in future turns
                memory.addMessage(convId, "assistant", reply);

                console.log(chalk.green(`[Bot]  `) + (reply.length > 80 ? reply.substring(0, 80) + "..." : reply));
                console.log(chalk.dim(`  (${memory.size} active chats, ${conversationHistory.length + 1} messages in this thread)`));

                await sock.sendMessage(jid, { text: reply });
            } catch (error: any) {
                console.error(chalk.red(`Error processing message: ${error.message}`));
                // Don't send error text to user — it can trigger echo loops
            } finally {
                activeLocks.delete(jid);
            }
            } // end for
        });
    }

    await connectSocket();
}

export function registerWhatsappCommands(program: Command) {
    program
        .command("whatsapp")
        .description("Deploy your Mindflare app as a WhatsApp bot via QR scan")
        .action(async () => {
            const token = requireToken(); // Ensure logged in

            const spinner = ora("Fetching your applications...").start();
            try {
                const data = await api<any>({
                    method: "GET",
                    url: `${getBaseUrl()}/api/applications/`,
                    token,
                });
                spinner.stop();

                const apps = data.applications || [];
                if (apps.length === 0) {
                    fatal("You don't have any apps yet. Run `mindflare apps create` first.");
                }

                console.log();
                const answer = await inquirer.prompt([
                    {
                        type: "list",
                        name: "appId",
                        message: "Which application do you want to run as a WhatsApp bot?",
                        choices: apps.map((app: any) => ({
                            name: `${app.app_name} ${chalk.dim(`(${app.model_name})`)}`,
                            value: app.app_id,
                        })),
                    },
                ]);

                await startWhatsAppBot(answer.appId);

            } catch (err: any) {
                spinner.stop();
                fatal(err.message);
            }
        });
}
