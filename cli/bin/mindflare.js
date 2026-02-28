#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const program = new Command();
const CONFIG_FILE = path.join(process.cwd(), 'mindflare.json');

program
    .name('mindflare')
    .description('CLI tool for Mindflare AI')
    .version('1.0.0');

program
    .command('init')
    .description('Initialize config and store API key locally')
    .option('-k, --key <apiKey>', 'Mindflare API Key')
    .action((options) => {
        const key = options.key || process.env.MINDFLARE_API_KEY;
        if (!key) {
            console.error('Please provide an API key using -k or set MINDFLARE_API_KEY environment variable.');
            process.exit(1);
        }

        const config = { apiKey: key };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log('✅ Config initialized at mindflare.json');
    });

program
    .command('test')
    .description('Test your AI chatbot locally')
    .argument('<message>', 'Message to send to the chatbot')
    .action(async (message) => {
        if (!fs.existsSync(CONFIG_FILE)) {
            console.error('Config not found. Run "npx mindflare init -k <KEY>" first.');
            process.exit(1);
        }
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));

        try {
            console.log(`Sending message: "${message}"...`);
            // Simulating a request to the backend
            const response = await axios.post(
                'https://api.mindflare.ai/api/chat/',
                { messages: [{ role: "user", content: message }] },
                { headers: { 'Authorization': `Bearer ${config.apiKey}` } }
            );

            console.log('🤖 Bot:', response.data.response);
            console.log(`⏱️ Tokens Used: ${response.data.usage?.total_tokens} (${response.data.provider})`);
        } catch (e) {
            console.error('Error contacting Mindflare:', e.response?.data || e.message);
        }
    });

program
    .command('deploy')
    .description('Deploy config to dashboard (Mock behavior)')
    .action(() => {
        if (!fs.existsSync(CONFIG_FILE)) {
            console.error('No configuration found. Init first.');
            process.exit(1);
        }
        console.log('🚀 Deploying configuration to Mindflare Dashboard...');
        setTimeout(() => {
            console.log('✅ Deployed successfully!');
        }, 1500);
    });

program.parse(process.argv);
