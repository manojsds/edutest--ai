const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const GEMINI_MODELS = (process.env.GEMINI_MODELS || 'gemini-2.5-flash,gemini-2.0-flash')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
const GEMINI_MAX_RETRIES = Number(process.env.GEMINI_MAX_RETRIES || 3);

const isRetryableGeminiStatus = (status) => status === 429 || status === 500 || status === 503;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(prompt) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    let lastError = null;

    for (const model of GEMINI_MODELS) {
        const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
            const response = await fetch(`${modelUrl}?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                }),
            });

            if (response.ok) {
                return response.json();
            }

            const errTxt = await response.text();
            const retryable = isRetryableGeminiStatus(response.status);
            lastError = new Error(`Gemini explain failed with status ${response.status}: ${errTxt}`);
            console.error('Gemini explain error', {
                model,
                attempt,
                status: response.status,
                details: errTxt,
            });

            if (retryable && attempt < GEMINI_MAX_RETRIES) {
                const backoffMs = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
                await wait(backoffMs);
                continue;
            }

            break;
        }
    }

    throw lastError || new Error('Gemini explain failed');
}

router.post('/explain', async (req, res) => {
    try {
        const { prompt } = req.body;
        const result = await callGemini(prompt);
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return res.status(500).json({ error: 'No explanation returned' });

        res.json({ explanation: text });
    } catch (err) {
        console.error('Error /explain', err);
        res.status(500).json({ error: 'Failed to generate explanation', details: err.message });
    }
});

module.exports = router;