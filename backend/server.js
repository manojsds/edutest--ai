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

// RAG Service Configuration
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'https://edutest-ai.onrender.com';

// Basic route for testing the server
app.get('/', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API endpoint is working!' });
});

// RAG Service Health Check
app.get('/api/rag/health', async (req, res) => {
  try {
    console.log(`Checking RAG service health at ${RAG_SERVICE_URL}...`);
    const response = await fetch(`${RAG_SERVICE_URL}/health`, { timeout: 5000 });
    
    if (response.ok) {
      res.json({ 
        status: 'healthy', 
        ragService: RAG_SERVICE_URL,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({ 
        status: 'unhealthy', 
        ragService: RAG_SERVICE_URL,
        statusCode: response.status
      });
    }
  } catch (e) {
    res.status(503).json({ 
      status: 'unreachable', 
      ragService: RAG_SERVICE_URL,
      error: e.message
    });
  }
});

// Search Current Affairs from RAG
app.post('/api/rag/search', async (req, res) => {
  try {
    const { query, subject = 'UPSC', limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Searching RAG for: ${query} (${subject})`);
    const context = await fetchContextFromRAG(query, subject);
    
    if (context) {
      res.json({ 
        query, 
        subject, 
        context,
        source: 'rag-service',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({ 
        error: 'RAG service unavailable',
        query,
        subject
      });
    }
  } catch (e) {
    console.error('RAG search error:', e);
    res.status(500).json({ 
      error: 'Failed to search RAG',
      message: e.message
    });
  }
});

// Mount routes
app.use('/api', require('./routes/explanations'));
app.use('/api', require('./routes/payment'));
// app.use('/api', require('./routes/feedback')); // TODO: Create feedback route

// ============================================
// IMPROVED RAG: Perplexity-Style Architecture
// ============================================

// 1. Query Decomposition - Break complex queries into simple ones
const decomposeQuery = (topic, subject) => {
  const queries = [];
  const year = new Date().getFullYear();
  const month = new Date().toLocaleString('default', { month: 'long' });
  
  // Base query
  queries.push(`${topic} ${subject} ${month} ${year}`);
  
  // If current affairs, add time-based queries
  if (topic.toLowerCase().includes('current')) {
    queries.push(`India news ${month} ${year}`);
    queries.push(`${subject} current affairs latest updates`);
    queries.push(`recent developments India ${month}`);
  }
  
  // Subject-specific queries
  if (subject === 'UPSC') {
    queries.push(`UPSC ${topic} recent updates`);
    queries.push(`IAS preparation ${topic}`);
  }
  
  return queries.slice(0, 3); // Top 3 sub-queries
};

// 2. Multi-Source Search - Try multiple reliable sources
const searchMultipleSources = async (query) => {
  const sources = [];
  
  // Source 1: Google News RSS (Most reliable for current affairs)
  try {
    const newsQuery = encodeURIComponent(query);
    const newsUrl = `https://news.google.com/rss/search?q=${newsQuery}&hl=en-IN&gl=IN&ceid=IN:en`;
    const newsResponse = await fetch(newsUrl, { 
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (newsResponse.ok) {
      const newsText = await newsResponse.text();
      
      // Improved regex to handle various CDATA formats
      const titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gi;
      const descRegex = /<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/gi;
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      
      const items = [...newsText.matchAll(itemRegex)];
      
      if (items.length > 1) { // Skip first (channel info)
        const headlines = [];
        
        for (let i = 1; i < Math.min(6, items.length); i++) { // Skip channel, get 5 news items
          const itemContent = items[i][1];
          const titleMatch = itemContent.match(titleRegex);
          const descMatch = itemContent.match(descRegex);
          
          if (titleMatch && titleMatch[0]) {
            let title = titleMatch[0].replace(/<!\[CDATA\[|\]\]>|<\/?title>/g, '').trim();
            let desc = '';
            
            if (descMatch && descMatch[0]) {
              desc = descMatch[0].replace(/<!\[CDATA\[|\]\]>|<\/?description>|<[^>]*>/g, '').trim();
            }
            
            if (title) {
              headlines.push(desc ? `${title}: ${desc.substring(0, 150)}` : title);
            }
          }
        }
        
        if (headlines.length > 0) {
          sources.push({
            source: 'Google News India',
            content: headlines.join('\n\n'),
            quality: 95
          });
          console.log(`   ✓ Google News: ${headlines.length} articles`);
        }
      }
    }
  } catch (e) {
    console.warn(`   ✗ Google News failed: ${e.message}`);
  }
  
  // Source 2: Wikipedia search (for factual background)
  try {
    // Extract key topic words for better Wikipedia search
    const topicWords = query.replace(/current affairs|recent|latest|2026|India/gi, '').trim();
    
    if (topicWords.length > 3) {
      const wikiQuery = encodeURIComponent(topicWords);
      const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${wikiQuery}&format=json&origin=*`;
      
      const wikiResponse = await fetch(wikiSearchUrl, { timeout: 5000 });
      
      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        
        if (wikiData.query?.search?.length > 0) {
          const topResult = wikiData.query.search[0];
          const snippet = topResult.snippet.replace(/<[^>]*>/g, ''); // Remove HTML tags
          
          sources.push({
            source: `Wikipedia: ${topResult.title}`,
            content: snippet,
            quality: 85
          });
          console.log(`   ✓ Wikipedia: ${topResult.title}`);
        }
      }
    }
  } catch (e) {
    console.warn(`   ✗ Wikipedia failed: ${e.message}`);
  }
  
  // Source 3: The Hindu RSS (Reliable Indian news)
  try {
    const theHinduUrl = 'https://www.thehindu.com/news/national/feeder/default.rss';
    const hindiResponse = await fetch(theHinduUrl, { 
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (hindiResponse.ok) {
      const hindiText = await hindiResponse.text();
      const items = hindiText.match(/<item[\s\S]*?<\/item>/g);
      
      if (items && items.length > 0) {
        const headlines = [];
        
        for (let i = 0; i < Math.min(3, items.length); i++) {
          const titleMatch = items[i].match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
          
          if (titleMatch && titleMatch[1]) {
            headlines.push(titleMatch[1].trim());
          }
        }
        
        if (headlines.length > 0) {
          sources.push({
            source: 'The Hindu',
            content: headlines.join('\n'),
            quality: 90
          });
          console.log(`   ✓ The Hindu: ${headlines.length} articles`);
        }
      }
    }
  } catch (e) {
    console.warn(`   ✗ The Hindu failed: ${e.message}`);
  }
  
  return sources;
};

// 3. Combine and Rank Sources
const combineAndRankSources = (allSources) => {
  // Sort by quality score
  const sorted = allSources.sort((a, b) => b.quality - a.quality);
  
  // Build combined context
  let context = '';
  const sourceNames = [];
  
  for (const source of sorted.slice(0, 5)) {
    context += `[${source.source}]\n${source.content}\n\n`;
    sourceNames.push(source.source);
  }
  
  return {
    context: context.trim(),
    sources: sourceNames
  };
};

// Main RAG Function
const fetchContextFromRAG = async (topic, subject) => {
  try {
    console.log(`\n🔍 Fetching context for: ${subject} - ${topic}`);
    
    // Step 1: Query Decomposition
    const subQueries = decomposeQuery(topic, subject);
    console.log(`📝 Sub-queries: ${subQueries.length}`);
    
    // Step 2: Search all sub-queries in parallel
    const searchPromises = subQueries.map(q => searchMultipleSources(q));
    const resultsArray = await Promise.all(searchPromises);
    
    // Flatten results
    const allSources = resultsArray.flat();
    console.log(`📊 Found ${allSources.length} sources`);
    
    if (allSources.length === 0) {
      console.warn('❌ No sources found');
      return null;
    }
    
    // Step 3: Combine and Rank
    const { context, sources } = combineAndRankSources(allSources);
    
    console.log(`✅ Context retrieved (${context.length} chars) from: ${sources.join(', ')}`);
    
    return context;
    
  } catch (e) {
    console.error('❌ RAG failed:', e.message);
    return null;
  }
};

// Questions endpoint
app.post('/api/questions', async (req, res) => {
  try {
    const { subject = 'UPSC', topic = 'Modern Indian History (1857-1900)', count = 5, useRecent = false } = req.body;
    
    console.log('Generating questions for:', { subject, topic, count, useRecent });
    
    // Fetch context from RAG service if current affairs or recent content requested
    let contextSnippet = '';
    if (useRecent || (typeof topic === 'string' && topic.toLowerCase().includes('current'))) {
      try {
        console.log('Attempting to fetch recent context from RAG service...');
        const ragContext = await fetchContextFromRAG(topic, subject);
        
        if (ragContext) {
          contextSnippet = `Current Information Context:\n${ragContext}\n\n`;
          console.log('Successfully integrated RAG context');
        } else {
          console.warn('RAG service unavailable, proceeding with base knowledge');
        }
      } catch (e) {
        console.warn('Error fetching RAG context:', e.message || e);
      }
    }

    // Build improved prompt based on whether we have context
    let prompt;
    if (contextSnippet) {
      // Prompt with RAG context - UPSC-style questions
      prompt = `You are creating UPSC Civil Services Examination (Prelims) style questions based on the following CURRENT INFORMATION:

${contextSnippet}

TASK: Generate exactly ${count} multiple-choice questions for ${subject} ${topic} exam preparation.

CRITICAL INSTRUCTIONS FOR UPSC-STYLE QUESTIONS:
1. Base ALL questions on the current information provided above
2. Mix question formats (10% statement-based, 90% standard MCQs)
3. Use UPSC language: formal, precise, analytical
4. Difficulty: UPSC Prelims level (Medium to High)
5. All 4 options must be plausible and closely related
6. Return ONLY valid JSON, no markdown formatting

QUESTION FORMATS TO USE:

A. Standard MCQ (80%):
   - Direct factual questions with clear options
   - Example: "Which of the following was announced in..."

B. Statement-based Questions (10%):
   - Format: "Consider the following statements: 1. [statement] 2. [statement]
     Which of the statements given above is/are correct?"
   - Options: "1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"

C. Match/Multiple Statement Questions (10%):
   - Analytical questions requiring understanding of multiple facts
   - Example: "With reference to [topic], consider the following..."

JSON Format (EXACT):
[
  {
    "id": 1,
    "question": "Question text in UPSC style based on current information?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation citing the source from current information."
  }
]

IMPORTANT: Questions should sound like they're from actual UPSC CSE Prelims paper. Use phrases like:
- "With reference to..."
- "Consider the following statements..."
- "Which of the following is/are correct?"
- "In the context of..."`;
    } else {
      // Prompt without context - UPSC-style from general knowledge
      prompt = `Generate exactly ${count} UPSC Civil Services Prelims style multiple-choice questions for ${subject} ${topic}.

UPSC QUESTION GUIDELINES:
1. Use formal UPSC language and structure
2. Mix formats: 80% standard MCQ, 10% statement-based, 10% analytical
3. Difficulty: Medium to Hard (UPSC Prelims standard)
4. All options must be plausible and closely related
5. Return ONLY valid JSON array, no markdown

JSON Format:
[
  {
    "id": 1,
    "question": "With reference to [topic], which of the following statements is correct?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation with historical/factual context."
  }
]

For statement-based questions, use format:
"Consider the following statements:
1. [Statement one]
2. [Statement two]
Which of the statements given above is/are correct?"
Options: "1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"`;
    }

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
