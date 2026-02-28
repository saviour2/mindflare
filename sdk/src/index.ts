import axios, { AxiosInstance } from "axios";

export interface MindflareOptions {
    apiKey: string;
    baseURL?: string;
}

export interface ChatMessage {
    role?: "system" | "user" | "assistant";
    content: string;
}

export interface ChatRequest {
    message: string;
}

export interface ChatResponse {
    response: string;
    usage: any;
    provider: string;
}

export class Mindflare {
    private client: AxiosInstance;

    constructor(options: MindflareOptions) {
        if (!options.apiKey) {
            throw new Error("Mindflare SDK requires an apiKey.");
        }
        this.client = axios.create({
            baseURL: options.baseURL || "https://api.mindflare.ai/api",
            headers: {
                "Authorization": `Bearer ${options.apiKey}`,
                "Content-Type": "application/json",
            },
        });
    }

    public async chat(request: ChatRequest): Promise<ChatResponse> {
        try {
            const response = await this.client.post("/chat/", {
                messages: [{ role: "user", content: request.message }],
            });
            return response.data as ChatResponse;
        } catch (error: any) {
            if (error.response) {
                throw new Error(`Mindflare API Error: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(`Mindflare SDK Request failed: ${error.message}`);
        }
    }
}
