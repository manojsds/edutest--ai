const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

router.post('/explain', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

        const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
        });

        if (!response.ok) {
            const errTxt = await response.text();
            console.error('Gemini explain error', response.status, errTxt);
            return res.status(500).json({ error: 'Gemini explain failed', details: errTxt });
        }

        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return res.status(500).json({ error: 'No explanation returned' });

        res.json({ explanation: text });
    } catch (err) {
        console.error('Error /explain', err);
        res.status(500).json({ error: 'Failed to generate explanation', details: err.message });
    }
});

module.exports = router;