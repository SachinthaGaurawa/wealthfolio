export default async function handler(req, res) {
    // CORS headers for global access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { prompt, image } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    // Securely pull API keys from Vercel Environment Variables
    const geminiKey = process.env.WealthFlow_API_Key || "AIzaSyCU6KyYWjUg7Iikf3XdYteCiJnbJ_2ZZCQ";
    const deepseekKey = process.env.DEEPSEEK_API_KEY || "sk-5b66522f940d4d3fb3dbd77bf72d2177";
    const groqKey = process.env.GROQ_API_KEY || "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";

    // ---------------------------------------------------------
    // ENGINE 1: GEMINI (Primary - Handles Text & Vision/OCR)
    // ---------------------------------------------------------
    async function fetchGemini() {
        const model = image ? 'gemini-1.5-flash' : 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        
        const parts = [{ text: prompt }];
        if (image) {
            parts.push({ inline_data: { mime_type: "image/jpeg", data: image } });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts }], 
                generationConfig: { temperature: 0.7, maxOutputTokens: 1000 } 
            })
        });

        if (!response.ok) throw new Error(`Gemini status: ${response.status}`);
        const data = await response.json();
        
        if (data.promptFeedback?.blockReason) throw new Error('Blocked by Google Safety');
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        }
        throw new Error('Gemini returned an empty response');
    }

    // ---------------------------------------------------------
    // ENGINE 2: DEEPSEEK (Fallback 1 - High Intelligence)
    // ---------------------------------------------------------
    async function fetchDeepSeek() {
        if (image) throw new Error('DeepSeek skipped (Image passed to text-only model)');
        
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) throw new Error(`DeepSeek status: ${response.status}`);
        const data = await response.json();
        return data.choices[0].message.content;
    }

    // ---------------------------------------------------------
    // ENGINE 3: GROQ (Fallback 2 - Ultra Fast)
    // ---------------------------------------------------------
    async function fetchGroq() {
        if (image) throw new Error('Groq skipped (Image passed to text-only model)');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) throw new Error(`Groq status: ${response.status}`);
        const data = await response.json();
        return data.choices[0].message.content;
    }

    // =========================================================
    // EXECUTION CHAIN (The Fallback Logic)
    // =========================================================
    let errorLog = [];

    // Attempt 1: Gemini
    try {
        console.log('[AI ENGINE] Attempting Gemini...');
        const reply = await fetchGemini();
        console.log('[AI ENGINE] ✅ Gemini Success');
        return res.status(200).json({ reply });
    } catch (e) {
        console.error('[AI ENGINE] ❌ Gemini Failed:', e.message);
        errorLog.push(`Gemini: ${e.message}`);
    }

    // Attempt 2: DeepSeek
    try {
        console.log('[AI ENGINE] Attempting DeepSeek...');
        const reply = await fetchDeepSeek();
        console.log('[AI ENGINE] ✅ DeepSeek Success');
        return res.status(200).json({ reply });
    } catch (e) {
        console.error('[AI ENGINE] ❌ DeepSeek Failed:', e.message);
        errorLog.push(`DeepSeek: ${e.message}`);
    }

    // Attempt 3: Groq
    try {
        console.log('[AI ENGINE] Attempting Groq...');
        const reply = await fetchGroq();
        console.log('[AI ENGINE] ✅ Groq Success');
        return res.status(200).json({ reply });
    } catch (e) {
        console.error('[AI ENGINE] ❌ Groq Failed:', e.message);
        errorLog.push(`Groq: ${e.message}`);
    }

    // If all fail
    return res.status(503).json({ 
        error: "All AI Providers are temporarily down.",
        details: errorLog.join(' | ')
    });
}
