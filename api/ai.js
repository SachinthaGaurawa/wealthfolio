export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' };
  
  const { prompt, image, userId, conversationHistory, preferences } = req.body;
  
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  
  // Secure API keys
  const geminiKey = process.env.WealthFlow_API_Key || "AIzaSyCU6KyYWjUg7Iikf3XdYteCiJnbJ_2ZZCQ";
  const deepseekKey = process.env.DEEPSEEK_API_KEY || "sk-5b66522f940d4d3fb3dbd77bf72d2177";
  const groqKey = process.env.GROQ_API_KEY || "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";
  
  // Analyze prompt to determine response format
  const responseFormat = analyzePromptForFormat(prompt, conversationHistory);
  
  // Build enhanced prompt with context
  const enhancedPrompt = buildEnhancedPrompt(prompt, conversationHistory, preferences, responseFormat);
  
  let errorLog = [];
  let lastError = null;
  
  // Attempt 1: Gemini (Primary)
  try {
    console.log('[AI ENGINE] Attempting Gemini...');
    const reply = await fetchGemini(enhancedPrompt, conversationHistory, responseFormat);
    console.log('[AI ENGINE] ✅ Gemini Success');
    
    // Learn from this interaction
    await learnFromInteraction(userId, prompt, reply, responseFormat);
    
    return res.status(200).json({ 
      reply, 
      format: responseFormat,
      source: 'gemini',
      improved: true
    });
  } catch (e) {
    console.error('[AI ENGINE] ❌ Gemini Failed:', e.message);
    errorLog.push(`Gemini: ${e.message}`);
    lastError = e;
  }
  
  // Attempt 2: DeepSeek (Fallback)
  try {
    console.log('[AI ENGINE] Attempting DeepSeek...');
    const reply = await fetchDeepSeek(enhancedPrompt, conversationHistory, responseFormat);
    console.log('[AI ENGINE] ✅ DeepSeek Success');
    
    await learnFromInteraction(userId, prompt, reply, responseFormat);
    
    return res.status(200).json({ 
      reply, 
      format: responseFormat,
      source: 'deepseek',
      improved: true
    });
  } catch (e) {
    console.error('[AI ENGINE] ❌ DeepSeek Failed:', e.message);
    errorLog.push(`DeepSeek: ${e.message}`);
    lastError = e;
  }
  
  // Attempt 3: Groq (Final Fallback)
  try {
    console.log('[AI ENGINE] Attempting Groq...');
    const reply = await fetchGroq(enhancedPrompt, conversationHistory, responseFormat);
    console.log('[AI ENGINE] ✅ Groq Success');
    
    await learnFromInteraction(userId, prompt, reply, responseFormat);
    
    return res.status(200).json({ 
      reply, 
      format: responseFormat,
      source: 'groq',
      improved: true
    });
  } catch (e) {
    console.error('[AI ENGINE] ❌ Groq Failed:', e.message);
    errorLog.push(`Groq: ${e.message}`);
    lastError = e;
  }
  
  // All providers failed
  return res.status(503).json({
    error: "All AI Providers are temporarily down.",
    details: errorLog.join(' | ')
  });
}

// Analyze prompt to determine best response format
function analyzePromptForFormat(prompt, conversationHistory) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for explicit format requests
  if (lowerPrompt.includes('short') || lowerPrompt.includes('brief') || 
      lowerPrompt.includes('quick') || lowerPrompt.includes('simple answer')) {
    return 'simple';
  }
  
  if (lowerPrompt.includes('explain') || lowerPrompt.includes('detailed') || 
      lowerPrompt.includes('how') || lowerPrompt.includes('why') ||
      lowerPrompt.includes('tell me more') || lowerPrompt.includes('in detail')) {
    return 'paragraph';
  }
  
  if (lowerPrompt.includes('list') || lowerPrompt.includes('steps') ||
      lowerPrompt.includes('options') || lowerPrompt.includes('ways')) {
    return 'list';
  }
  
  if (lowerPrompt.includes('compare') || lowerPrompt.includes('vs') ||
      lowerPrompt.includes('versus')) {
    return 'comparison';
  }
  
  // Analyze conversation context
  if (conversationHistory && conversationHistory.length > 0) {
    const lastResponse = conversationHistory[conversationHistory.length - 1];
    if (lastResponse?.format === 'simple') {
      // User might want more detail
      return 'paragraph';
    }
  }
  
  // Default to paragraph for financial advice
  return 'paragraph';
}

// Build enhanced prompt with user context and formatting instructions
function buildEnhancedPrompt(prompt, conversationHistory, preferences, responseFormat) {
  const formatInstructions = getFormatInstructions(responseFormat);
  
  const systemPrompt = `You are WealthFlow AI, a friendly, helpful financial advisor. 
You help users with finance but also general questions in a warm, conversational way.
Always be friendly, approachable, and supportive. Use the user's name if available.
${formatInstructions}

Guidelines:
- Be conversational and friendly, not robotic
- For non-financial questions, still be helpful and engaging
- Adapt your response length to what the user needs
- Use appropriate formatting based on the request
- If unsure about something, admit it honestly
- Always prioritize the user's benefit`;

  return {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    systemInstruction: {
      role: 'system',
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: getMaxTokens(responseFormat),
    }
  };
}

function getFormatInstructions(format) {
  switch (format) {
    case 'simple':
      return `RESPONSE FORMAT: Give a brief, concise answer. 1-3 sentences maximum. Get straight to the point.`;
    case 'paragraph':
      return `RESPONSE FORMAT: Provide a detailed, well-explained response in paragraph form. Cover the topic thoroughly with clear explanations.`;
    case 'list':
      return `RESPONSE FORMAT: Present information as a clear, numbered or bulleted list. Each point should be concise but informative.`;
    case 'comparison':
      return `RESPONSE FORMAT: Present a clear comparison with pros and cons, or side-by-side analysis. Use tables or structured format.`;
    default:
      return `RESPONSE FORMAT: Provide a helpful, well-structured response.`;
  }
}

function getMaxTokens(format) {
  switch (format) {
    case 'simple': return 256;
    case 'paragraph': return 2048;
    case 'list': return 1024;
    case 'comparison': return 1536;
    default: return 1024;
  }
}

// Learn from user interactions to improve future responses
async function learnFromInteraction(userId, prompt, response, format) {
  if (!userId) return;
  
  // Store interaction for pattern learning
  const interaction = {
    userId,
    prompt,
    response,
    format,
    timestamp: Date.now(),
    category: categorizePrompt(prompt)
  };
  
  // In production, this would be stored in a database
  // and used to train/fine-tune the model or adjust prompts
  console.log('[AI LEARNING] Interaction logged:', interaction.category);
}

function categorizePrompt(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes('budget') || lower.includes('spending') || lower.includes('expense')) return 'spending';
  if (lower.includes('save') || lower.includes('investment') || lower.includes('return')) return 'investment';
  if (lower.includes('debt') || lower.includes('loan') || lower.includes('credit')) return 'debt';
  if (lower.includes('bill') || lower.includes('payment') || lower.includes('due')) return 'bills';
  if (lower.includes('how are you') || lower.includes('hello') || lower.includes('hi')) return 'greeting';
  if (lower.includes('what') || lower.includes('how') || lower.includes('why')) return 'general';
  return 'other';
}

// Enhanced fetch functions with better error handling
async function fetchGemini(promptData, history, format) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(promptData)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response from Gemini');
  }
  
  return formatResponse(data.candidates[0].content.parts[0].text, format);
}

async function fetchDeepSeek(promptData, history, format) {
  const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: getSystemMessage(format) },
    ...(history || []).slice(-5).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: promptData.contents[0].parts[0].text }
  ];
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deepseekKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.9,
      max_tokens: getMaxTokens(format)
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${error}`);
  }
  
  const data = await response.json();
  return formatResponse(data.choices[0].message.content, format);
}

async function fetchGroq(promptData, history, format) {
  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: getSystemMessage(format) },
    ...(history || []).slice(-5).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: promptData.contents[0].parts[0].text }
  ];
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages,
      temperature: 0.9,
      max_tokens: getMaxTokens(format)
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }
  
  const data = await response.json();
  return formatResponse(data.choices[0].message.content, format);
}

function getSystemMessage(format) {
  return `You are WealthFlow AI, a friendly and helpful financial advisor. 
You assist with finance and general questions in a warm, conversational manner.
${getFormatInstructions(format)}
Be friendly, not robotic. Adapt to what the user needs.`;
}

function formatResponse(text, format) {
  // Clean and format the response
  let formatted = text.trim();
  
  // Remove any markdown if present (can be adjusted based on preference)
  // Keep basic formatting
  
  return formatted;
}
