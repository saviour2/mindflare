/**
 * Mindflare AI SDK
 * Integration in 3 lines of code.
 */
class Mindflare {
    constructor(apiKey, baseUrl = 'http://localhost:5000/api') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    /**
     * Send a message to your Mindflare Chatbot
     * @param {string} message - User input
     * @param {Array} history - Previous messages [{role, content}]
     * @returns {Promise<Object>} - LLM Response and Usage
     */
    async chat(message, history = []) {
        const messages = [...history, { role: 'user', content: message }];

        try {
            const response = await fetch(`${this.baseUrl}/chat/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({ messages })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to contact Mindflare AI');
            }

            return await response.json();
        } catch (err) {
            console.error('Mindflare SDK Error:', err.message);
            throw err;
        }
    }
}

export default Mindflare;
