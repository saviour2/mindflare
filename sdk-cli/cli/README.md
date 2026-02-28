# @mindflare/cli

> Official CLI for the **Mindflare AI** platform.

Manage your AI applications, knowledge bases, and chat sessions directly from the terminal.

## Installation

```bash
npm install -g @mindflare/cli
```

Or run directly with npx:

```bash
npx @mindflare/cli --help
```

## Quick Start

```bash
# 1. Login (or register first)
mindflare login

# 2. Create an application
mindflare apps create --name "My Chatbot"

# 3. Ingest a knowledge base
mindflare kb create \
  --name "Company Docs" \
  --type website \
  --url https://docs.yourcompany.com \
  --wait   # polls until ingestion completes

# 4. Chat with your bot
mindflare chat --api-key YOUR_API_KEY

# Or send a single message
mindflare chat --api-key YOUR_API_KEY -m "What is RAG?"
```

## Commands

### Authentication

| Command | Description |
|---------|-------------|
| `mindflare login` | Authenticate (interactive or with `--email`/`--password`) |
| `mindflare register` | Create a new account |
| `mindflare logout` | Clear saved authentication |
| `mindflare whoami` | Show current user |

### Applications

| Command | Description |
|---------|-------------|
| `mindflare apps list` | List all applications |
| `mindflare apps create -n NAME` | Create a new app (shows API key once) |
| `mindflare apps info APP_ID` | Get application details |
| `mindflare apps delete APP_ID` | Delete an application |
| `mindflare apps use APP_ID` | Set default app for future commands |

### Knowledge Bases

| Command | Description |
|---------|-------------|
| `mindflare kb list` | List all knowledge bases |
| `mindflare kb create -n NAME -t TYPE -u URL` | Create from website/github |
| `mindflare kb status KB_ID` | Check ingestion progress |
| `mindflare kb status KB_ID --wait` | Watch until completion |
| `mindflare kb delete KB_ID` | Delete a knowledge base |

### Chat

| Command | Description |
|---------|-------------|
| `mindflare chat` | Start interactive chat (prompts for API key) |
| `mindflare chat --api-key KEY` | Start interactive chat |
| `mindflare chat --api-key KEY -m "Hi"` | Single message mode |

Interactive commands: `/quit`, `/clear`, `/exit`

### Configuration

| Command | Description |
|---------|-------------|
| `mindflare config` | Show current configuration |
| `mindflare config --set-url URL` | Set API base URL |

## Examples

### Interactive Chat Session

```
$ mindflare chat --api-key mf_abc123
  Mindflare AI — Interactive Chat
  Type your message and press Enter. Use /quit to exit.

  You: What is retrieval augmented generation?

  RAG is a technique that enhances AI responses by first
  retrieving relevant information from a knowledge base...

  [groq · 234 tokens · RAG]

  You: /quit
  Goodbye! 👋
```

### Watch Ingestion Progress

```
$ mindflare kb create -n "API Docs" -t website -u https://docs.api.com --wait

  ✓ Knowledge base "API Docs" created (abc123)
  ⠋ 40% Crawled 12 pages (45,230 chars) — splitting into chunks...
  ⠋ 65% Embedding 87 chunks (this may take a moment)...
  ✓ Ingestion complete — 87 chunks created
```

## Environment

The CLI stores configuration in `~/.config/mindflare/config.json`:

- **token** — JWT authentication token
- **baseUrl** — API base URL (default: `http://localhost:5000`)
- **defaultAppId** — Default application for commands

## License

MIT
