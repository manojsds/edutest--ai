const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  // Keep the API booting even if deploy environment skips this dependency.
  console.warn('express-rate-limit not available, continuing without rate limiting.');
  rateLimit = () => (req, res, next) => next();
}
require('dotenv').config();

// Initialize Firebase (must be done before importing models)
require('./config/firebase');

const app = express();
const ports = [5000, 5001, 5002, 3000, 3001]; // List of ports to try
let currentPortIndex = 0;

// Rate limiting for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 requests per IP per 15 minutes
  message: {
    error: 'Too many requests',
    message: 'Please try again later or sign up for unlimited access'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [/\.vercel\.app$/, /\.edutest\.ai$/, process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001']
}));
app.use(express.json());

// LLM provider configuration (cheaper defaults + fallback)
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

async function tryGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    for (let attempt = 1; attempt <= LLM_MAX_RETRIES; attempt++) {
      const response = await fetch(`${modelUrl}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }],
          }],
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

      const errorText = await response.text();
      const retryable = isRetryableLlmStatus(response.status);
      lastError = new Error(`Gemini failed with status ${response.status}: ${errorText}`);

      console.error('Gemini API Error:', {
        model,
        attempt,
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      if (retryable && attempt < LLM_MAX_RETRIES) {
        const backoffMs = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
        console.warn(`Retrying Gemini in ${backoffMs}ms (model=${model}, attempt=${attempt})`);
        await wait(backoffMs);
        continue;
      }

      break;
    }
  }

  throw lastError || new Error('Gemini request failed');
}

async function tryGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
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

      const errorText = await response.text();
      const retryable = isRetryableLlmStatus(response.status);
      lastError = new Error(`Groq failed with status ${response.status}: ${errorText}`);

      console.error('Groq API Error:', {
        model,
        attempt,
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      if (retryable && attempt < LLM_MAX_RETRIES) {
        const backoffMs = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
        console.warn(`Retrying Groq in ${backoffMs}ms (model=${model}, attempt=${attempt})`);
        await wait(backoffMs);
        continue;
      }

      break;
    }
  }

  throw lastError || new Error('Groq request failed');
}

async function generateWithLlm(prompt) {
  let lastError = null;

  for (const provider of LLM_PROVIDER_ORDER) {
    try {
      if (provider === 'gemini') {
        return await tryGemini(prompt);
      }
      if (provider === 'groq') {
        return await tryGroq(prompt);
      }
    } catch (error) {
      lastError = error;
      console.warn(`LLM provider ${provider} failed, trying next provider.`, error.message);
    }
  }

  throw lastError || new Error('No LLM provider succeeded');
}

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
app.use('/api/auth', require('./routes/authRoutes')); // Authentication routes
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

const getExamPromptProfile = (subject, examPattern, examDifficulty, examFocusAreas) => {
  const subjectKey = String(subject || '').toLowerCase();

  const defaults = {
    examLabel: subject || 'Indian Competitive Exam',
    pattern: 'Objective single-correct MCQ',
    difficulty: 'Medium',
    languageStyle: 'clear, exam-oriented and precise',
    focusAreas: [subject || 'General Studies']
  };

  if (subjectKey.includes('neet')) {
    defaults.examLabel = 'NEET UG';
    defaults.pattern = 'Single correct objective MCQ';
    defaults.difficulty = 'Medium to High';
    defaults.languageStyle = 'medical entrance, concept + application focused';
    defaults.focusAreas = ['Physics', 'Chemistry', 'Biology (Botany and Zoology)'];
  } else if (subjectKey.includes('jee advanced')) {
    defaults.examLabel = 'JEE Advanced';
    defaults.pattern = 'Advanced conceptual objective MCQ';
    defaults.difficulty = 'High';
    defaults.languageStyle = 'highly conceptual, multi-step reasoning';
    defaults.focusAreas = ['Advanced Physics', 'Advanced Chemistry', 'Advanced Mathematics'];
  } else if (subjectKey.includes('jee')) {
    defaults.examLabel = 'JEE Main';
    defaults.pattern = 'Single correct objective MCQ';
    defaults.difficulty = 'Medium to High';
    defaults.languageStyle = 'engineering entrance, conceptual and calculation-oriented';
    defaults.focusAreas = ['Physics', 'Chemistry', 'Mathematics'];
  } else if (subjectKey.includes('upsc')) {
    defaults.examLabel = 'UPSC CSE Prelims';
    defaults.pattern = 'Objective MCQ with statement-based mix';
    defaults.difficulty = 'Medium to High';
    defaults.languageStyle = 'formal, analytical, policy-aware';
    defaults.focusAreas = ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Current Affairs'];
  } else if (subjectKey.includes('ssc')) {
    defaults.examLabel = 'SSC CGL';
    defaults.pattern = 'Tier-style objective MCQ';
    defaults.difficulty = 'Easy to Medium';
    defaults.languageStyle = 'direct and speed-test friendly';
    defaults.focusAreas = ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'];
  }

  return {
    examLabel: defaults.examLabel,
    pattern: examPattern || defaults.pattern,
    difficulty: examDifficulty || defaults.difficulty,
    languageStyle: defaults.languageStyle,
    focusAreas: Array.isArray(examFocusAreas) && examFocusAreas.length > 0 ? examFocusAreas : defaults.focusAreas
  };
};

const getDefaultExamBlueprint = () => ({
  sectionWeightage: {
    'Core Topic': 70,
    'Application and Analysis': 30
  },
  difficultyDistribution: {
    easy: 25,
    medium: 50,
    hard: 25
  },
  markingScheme: {
    correct: 1,
    wrong: 0,
    unattempted: 0
  }
});

const normalizeExamBlueprint = (examBlueprint) => {
  const fallback = getDefaultExamBlueprint();
  if (!examBlueprint || typeof examBlueprint !== 'object') return fallback;

  const sectionWeightage = (examBlueprint.sectionWeightage && typeof examBlueprint.sectionWeightage === 'object')
    ? examBlueprint.sectionWeightage
    : fallback.sectionWeightage;

  const difficultyDistribution = (examBlueprint.difficultyDistribution && typeof examBlueprint.difficultyDistribution === 'object')
    ? {
        easy: Number(examBlueprint.difficultyDistribution.easy ?? fallback.difficultyDistribution.easy),
        medium: Number(examBlueprint.difficultyDistribution.medium ?? fallback.difficultyDistribution.medium),
        hard: Number(examBlueprint.difficultyDistribution.hard ?? fallback.difficultyDistribution.hard)
      }
    : fallback.difficultyDistribution;

  const markingScheme = (examBlueprint.markingScheme && typeof examBlueprint.markingScheme === 'object')
    ? {
        correct: Number(examBlueprint.markingScheme.correct ?? fallback.markingScheme.correct),
        wrong: Number(examBlueprint.markingScheme.wrong ?? fallback.markingScheme.wrong),
        unattempted: Number(examBlueprint.markingScheme.unattempted ?? fallback.markingScheme.unattempted)
      }
    : fallback.markingScheme;

  return {
    sectionWeightage,
    difficultyDistribution,
    markingScheme
  };
};

const getSectionQuestionTargets = (sectionWeightage, totalCount) => {
  const entries = Object.entries(sectionWeightage || {});
  if (entries.length === 0) return [];

  const targets = entries.map(([section, weight]) => {
    const exact = (Number(weight) / 100) * totalCount;
    return {
      section,
      weight: Number(weight),
      count: Math.floor(exact),
      remainder: exact - Math.floor(exact)
    };
  });

  let assigned = targets.reduce((sum, t) => sum + t.count, 0);
  const remaining = Math.max(0, totalCount - assigned);

  targets
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, remaining)
    .forEach((t) => {
      t.count += 1;
      assigned += 1;
    });

  return targets
    .sort((a, b) => b.weight - a.weight)
    .map((t) => ({ section: t.section, count: t.count }));
};

const getQuestionStyleMixGuide = (subject, count) => {
  const subjectKey = String(subject || '').toLowerCase();
  const total = Math.max(1, Number(count) || 1);

  if (subjectKey.includes('upsc')) {
    const complexCount = Math.max(1, Math.round(total * 0.35));
    return [
      'Standard conceptual MCQ with close distractors',
      `Statement-based items (2-3 statements, choose correct combination) at least ${Math.max(1, Math.round(complexCount * 0.5))}`,
      `Assertion-Reason or Match-the-following at least ${Math.max(1, Math.round(complexCount * 0.3))}`,
      `Passage/caselet or map-geography analytical item at least ${Math.max(1, complexCount - Math.max(1, Math.round(complexCount * 0.5)) - Math.max(1, Math.round(complexCount * 0.3)))}`
    ];
  }

  if (subjectKey.includes('jee') || subjectKey.includes('neet')) {
    return [
      'Concept + application MCQ',
      'Numerical/logical multi-step MCQ where appropriate',
      'Data/graph/experimental scenario-based MCQ where appropriate'
    ];
  }

  return [
    'Standard conceptual MCQ',
    'Analytical scenario-based MCQ',
    'Statement-based MCQ where relevant'
  ];
};

// Questions endpoint
app.post('/api/questions', async (req, res) => {
  try {
    const {
      subject = 'UPSC',
      topic = 'Modern Indian History (1857-1900)',
      count = 5,
      useRecent = false,
      examPattern,
      examDifficulty,
      examFocusAreas,
      examBlueprint
    } = req.body;

    const examProfile = getExamPromptProfile(subject, examPattern, examDifficulty, examFocusAreas);
    const normalizedBlueprint = normalizeExamBlueprint(examBlueprint);
    
    console.log('Generating questions for:', { subject, topic, count, useRecent, examProfile, normalizedBlueprint });

    const sectionGuide = Object.entries(normalizedBlueprint.sectionWeightage)
      .map(([section, weight]) => `${section}: ${weight}%`)
      .join(', ');

    const sectionTargets = getSectionQuestionTargets(normalizedBlueprint.sectionWeightage, Number(count));
    const sectionTargetGuide = sectionTargets
      .map((s) => `${s.section}: ${s.count}`)
      .join(', ');

    const difficultyGuide = `Easy ${normalizedBlueprint.difficultyDistribution.easy}%, Medium ${normalizedBlueprint.difficultyDistribution.medium}%, Hard ${normalizedBlueprint.difficultyDistribution.hard}%`;
    const questionStyleMixGuide = getQuestionStyleMixGuide(subject, count)
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n');

    const markingGuide = `Correct +${normalizedBlueprint.markingScheme.correct}, Wrong ${normalizedBlueprint.markingScheme.wrong}, Unattempted ${normalizedBlueprint.markingScheme.unattempted}`;
    
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
      // Prompt with RAG context and exam-aware style
      prompt = `You are creating ${examProfile.examLabel} style questions based on the following CURRENT INFORMATION:

${contextSnippet}

TASK: Generate exactly ${count} multiple-choice questions for ${subject} ${topic} exam preparation.

CRITICAL EXAM INSTRUCTIONS:
1. Base ALL questions on the current information provided above
2. Follow pattern: ${examProfile.pattern}
3. Use language style: ${examProfile.languageStyle}
4. Difficulty level: ${examProfile.difficulty}
5. All 4 options must be plausible and closely related
6. Return ONLY valid JSON, no markdown formatting
7. Focus strongly on these exam areas: ${examProfile.focusAreas.join(', ')}
8. Approximate section weightage for this generated set: ${sectionGuide}
9. Approximate difficulty mix for this generated set: ${difficultyGuide}
10. Marking scheme context: ${markingGuide}
11. Target section-wise question counts (sum must be ${count}): ${sectionTargetGuide}
12. Enforce this question-style mix:
${questionStyleMixGuide}

QUESTION FORMAT MIX:
- 85% standard single-correct MCQs
- 15% analytical or statement-based (only if it fits the selected exam pattern)

COMPLEXITY RULES:
- For statement-based items, include explicit statements in the question body (e.g., Statement 1, Statement 2, Statement 3).
- For assertion-reason items, include Assertion and Reason explicitly in the question text.
- For passage/caselet items, include a short passage first and ask one question based on it.
- For map/geography items, use map-like spatial reasoning in text form (region, direction, river-basin, monsoon flow, latitude-longitude logic).

JSON Format (EXACT):
[
  {
    "id": 1,
    "question": "Question text in ${examProfile.examLabel} style based on current information?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation citing the source from current information."
  }
]

IMPORTANT: Questions should sound like actual ${examProfile.examLabel} paper-level questions.`;
    } else {
      // Prompt without context - exam-aware from general knowledge
      prompt = `Generate exactly ${count} ${examProfile.examLabel} style multiple-choice questions for ${subject} ${topic}.

QUESTION GUIDELINES:
1. Follow pattern: ${examProfile.pattern}
2. Difficulty: ${examProfile.difficulty}
3. Use language style: ${examProfile.languageStyle}
4. Focus areas: ${examProfile.focusAreas.join(', ')}
5. All options must be plausible and closely related
6. Return ONLY valid JSON array, no markdown
7. Approximate section weightage for this generated set: ${sectionGuide}
8. Approximate difficulty mix for this generated set: ${difficultyGuide}
9. Marking scheme context: ${markingGuide}
10. Target section-wise question counts (sum must be ${count}): ${sectionTargetGuide}
11. Enforce this question-style mix:
${questionStyleMixGuide}

COMPLEXITY RULES:
- For statement-based items, include explicit statements in the question body.
- For assertion-reason items, include Assertion and Reason explicitly in the question text.
- For passage/caselet items, include a short passage first and ask one question based on it.
- For map/geography items, use map-like spatial reasoning in text form.

JSON Format:
[
  {
    "id": 1,
    "question": "Exam-style question for ${examProfile.examLabel} on [topic]?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation with clear concept and reasoning."
  }
]`;
    }

    console.log('Making request to LLM API...');
    const { text, provider, model, attempt } = await generateWithLlm(prompt);
    console.log(`Received response from ${provider} (model=${model}, attempt=${attempt})`);
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
