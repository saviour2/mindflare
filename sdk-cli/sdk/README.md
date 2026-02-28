# @mindflare/sdk

> Official TypeScript/JavaScript SDK for the **Mindflare AI** platform.

Build AI-powered chatbots with RAG (Retrieval Augmented Generation) in minutes. This SDK provides a clean, type-safe interface to interact with the Mindflare API.

## Installation

```bash
npm install @mindflare/sdk
```

## Quick Start

### Chat (API Key Auth)

Use the `Mindflare` client to send messages to your chatbot. Authenticate with the API key from your application.

```typescript
import { Mindflare } from "@mindflare/sdk";

const mf = new Mindflare({
  apiKey: "your-api-key-here",
  baseUrl: "http://localhost:5000", // optional, defaults to localhost
});

// Full chat with message history
const response = await mf.chat({
  messages: [
    { role: "system", content: "You are a helpful coding assistant." },
    { role: "user", content: "How do I create a REST API in Python?" },
  ],
});

console.log(response.response);    // Assistant's reply
console.log(response.provider);    // "openrouter" or "groq"
console.log(response.context_used); // true if RAG context was injected

// One-liner convenience
const answer = await mf.ask("What is quantum computing?");
```

### Admin Client (JWT Auth)

Use `MindflareAdmin` to manage applications, knowledge bases, and models.

```typescript
import { MindflareAdmin } from "@mindflare/sdk";

const admin = new MindflareAdmin({
  baseUrl: "http://localhost:5000",
});

// Login (token is auto-stored for subsequent requests)
await admin.auth.login({ email: "you@example.com", password: "password123" });

// Create an application
const { app, apiKey } = await admin.apps.create({
  app_name: "My Chatbot",
  model_name: "meta-llama/llama-3.1-8b-instruct:free",
});
console.log("Save this API key:", apiKey);

// Create a knowledge base from a website
const kb = await admin.knowledgeBases.create({
  kb_name: "Company Docs",
  source_type: "website",
  source_url: "https://docs.yourcompany.com",
  app_id: app.app_id, // auto-links to the app
});

// Wait for ingestion with progress updates
const readyKB = await admin.knowledgeBases.waitForReady(kb.kb_id, {
  onProgress: (kb) => {
    console.log(`${kb.progress}% — ${kb.progress_message}`);
  },
});
console.log(`✓ ${readyKB.chunks_count} chunks ready`);

// List all apps
const apps = await admin.apps.list();
```

## API Reference

### `new Mindflare(config)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | *required* | Your application API key |
| `baseUrl` | `string` | `http://localhost:5000` | API base URL |
| `timeout` | `number` | `30000` | Request timeout (ms) |
| `maxRetries` | `number` | `2` | Max retries for 5xx errors |

#### Methods

- **`chat(options)`** — Send a chat completion request
- **`ask(question, opts?)`** — Send a single message, returns the reply string

### `new MindflareAdmin(config)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `token` | `string` | `""` | JWT token (or use `admin.auth.login()`) |
| `baseUrl` | `string` | `http://localhost:5000` | API base URL |
| `timeout` | `number` | `30000` | Request timeout (ms) |

#### Namespaces

- **`admin.auth`** — `.login()`, `.register()`, `.me()`
- **`admin.apps`** — `.list()`, `.get()`, `.create()`, `.delete()`, `.updateConfig()`
- **`admin.knowledgeBases`** — `.list()`, `.get()`, `.create()`, `.delete()`, `.waitForReady()`
- **`admin.models`** — `.list()`

## Error Handling

```typescript
import { MindflareError } from "@mindflare/sdk";

try {
  await mf.chat({ messages: [{ role: "user", content: "hi" }] });
} catch (error) {
  if (error instanceof MindflareError) {
    console.log(error.status);      // 401
    console.log(error.message);     // "Invalid API key"
    console.log(error.isAuthError); // true
    console.log(error.isRetryable); // false
  }
}
```

## License

MIT
