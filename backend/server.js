const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const ports = [5000, 5001, 5002, 3000, 3001]; // List of ports to try
let currentPortIndex = 0;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [/\.vercel\.app$/, process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001']
}));
app.use(express.json());

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Basic route for testing the server
app.get('/', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API endpoint is working!' });
});

// Mount explanations and payment routes
app.use('/api', require('./routes/explanations'));
app.use('/api', require('./routes/payment'));

// Questions endpoint
app.post('/api/questions', async (req, res) => {
  try {
    const { subject = 'UPSC', topic = 'Modern Indian History (1857-1900)', count = 5 } = req.body;
    
    console.log('Generating questions for:', { subject, topic, count });
    
    const prompt = `Generate exactly ${count} multiple-choice questions for ${subject} ${topic} for testing. Return ONLY a valid JSON array with no additional text or formatting. Each question object must have these exact keys: id (number starting from 1), question (string), options (array of exactly 4 strings), correctAnswer (number 0-3), explanation (string with detailed explanation of the correct answer).

Example format:
[
  {
    "id": 1,
    "question": "When did the Indian National Congress hold its first session?",
    "options": ["1885", "1886", "1887", "1888"],
    "correctAnswer": 0,
    "explanation": "The Indian National Congress held its first session on December 28, 1885, in Bombay. The session was presided over by W.C. Bonnerjee and was attended by 72 delegates. This marked the beginning of an organized national movement in India."
  }
]`;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Making request to Gemini API...');
    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Received response from Gemini API');

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0]) {
      console.error('Unexpected API response structure:', result);
      throw new Error('Invalid API response structure');
    }

    const text = result.candidates[0].content.parts[0].text;
    console.log('AI Response Text:', text);

    // Clean and parse the response
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\s*/, '').replace(/\s*```$/, '');
    }

    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const questions = JSON.parse(jsonText);

    // Validate the structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid response format: not an array or empty');
    }

    // Additional validation for each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.id || typeof q.question !== 'string' || !Array.isArray(q.options) || 
          q.options.length !== 4 || typeof q.correctAnswer !== 'number' || 
          q.correctAnswer < 0 || q.correctAnswer > 3 || !q.explanation) {
        throw new Error(`Invalid question format at index ${i}`);
      }
    }

    res.json(questions);
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Function to try starting the server on different ports
const tryStartServer = () => {
  if (currentPortIndex >= ports.length) {
    console.error('Could not find an available port');
    process.exit(1);
  }

  const port = process.env.PORT || ports[currentPortIndex];
  const server = app.listen(port)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying next port...`);
        currentPortIndex++;
        server.close();
        tryStartServer();
      } else {
        console.error('Server error:', err);
      }
    })
    .on('listening', () => {
      console.log(`Server running on port ${port}`);
      console.log(`Test endpoint: http://localhost:${port}/api/test`);
      console.log(`Questions endpoint: POST http://localhost:${port}/api/questions`);
    });
};

// Start server
tryStartServer();
