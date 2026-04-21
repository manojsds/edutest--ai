const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const GEMINI_MODELS = (process.env.GEMINI_MODELS || 'gemini-1.5-flash,gemini-1.5-flash-8b')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
const GROQ_MODELS = (process.env.GROQ_MODELS || 'llama-3.1-8b-instant,llama-3.3-70b-versatile')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
const LLM_PROVIDER_ORDER = (process.env.LLM_PROVIDER_ORDER || 'gemini,groq')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
const LLM_MAX_RETRIES = Number(process.env.LLM_MAX_RETRIES || process.env.GEMINI_MAX_RETRIES || 3);

const isRetryableLlmStatus = (status) => status === 429 || status === 500 || status === 503;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(prompt) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    let lastError = null;

    for (const model of GEMINI_MODELS) {
        const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        for (let attempt = 1; attempt <= LLM_MAX_RETRIES; attempt++) {
            const response = await fetch(`${modelUrl}?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) {
                    throw new Error('Gemini returned empty content');
                }
                return { text, provider: 'gemini', model, attempt };
            }

            const errTxt = await response.text();
            const retryable = isRetryableLlmStatus(response.status);
            lastError = new Error(`Gemini explain failed with status ${response.status}: ${errTxt}`);
            console.error('Gemini explain error', {
                model,
                attempt,
                status: response.status,
                details: errTxt,
            });

            if (retryable && attempt < LLM_MAX_RETRIES) {
                const backoffMs = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
                await wait(backoffMs);
                continue;
            }

            break;
        }
    }

    throw lastError || new Error('Gemini explain failed');
}

async function callGroq(prompt) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
    }

    let lastError = null;

    for (const model of GROQ_MODELS) {
        for (let attempt = 1; attempt <= LLM_MAX_RETRIES; attempt++) {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const text = result?.choices?.[0]?.message?.content;
                if (!text) {
                    throw new Error('Groq returned empty content');
                }
                return { text, provider: 'groq', model, attempt };
            }

            const errTxt = await response.text();
            const retryable = isRetryableLlmStatus(response.status);
            lastError = new Error(`Groq explain failed with status ${response.status}: ${errTxt}`);
            console.error('Groq explain error', {
                model,
                attempt,
                status: response.status,
                details: errTxt,
            });

            if (retryable && attempt < LLM_MAX_RETRIES) {
                const backoffMs = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
                await wait(backoffMs);
                continue;
            }

            break;
        }
    }

    throw lastError || new Error('Groq explain failed');
}

async function callLlm(prompt) {
    let lastError = null;

    for (const provider of LLM_PROVIDER_ORDER) {
        try {
            if (provider === 'gemini') {
                return await callGemini(prompt);
            }
            if (provider === 'groq') {
                return await callGroq(prompt);
            }
        } catch (error) {
            lastError = error;
            console.warn(`LLM provider ${provider} failed, trying next provider.`, error.message);
        }
    }

    throw lastError || new Error('No LLM provider succeeded');
}

router.post('/explain', async (req, res) => {
    try {
        const { prompt } = req.body;
        const { text, provider, model, attempt } = await callLlm(prompt);
        if (!text) return res.status(500).json({ error: 'No explanation returned' });

        res.json({ explanation: text, provider, model, attempt });
    } catch (err) {
        console.error('Error /explain', err);
        res.status(500).json({ error: 'Failed to generate explanation', details: err.message });
    }
});

module.exports = router;