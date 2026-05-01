export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { prompt, image } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const apiKey = process.env.WealthFlow_API_Key;
    if (!apiKey) {
        console.error('[AI] CRITICAL: WealthFlow_API_Key not set in environment');
        return res.status(500).json({ error: 'API key not configured. Set WealthFlow_API_Key in Vercel Settings → Environment Variables.' });
    }

    // Build request parts
    const parts = [{ text: prompt }];
    if (image) {
        parts.push({ inline_data: { mime_type: "image/jpeg", data: image } });
    }

    const requestBody = {
        contents: [{ parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
    };

    // Model fallback chain: try stable model first, then fallback
    const MODELS = [
        'gemini-2.0-flash',
        'gemini-1.5-flash'
    ];

    const MAX_RETRIES = 3;
    let lastError = null;

    for (const model of MODELS) {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                console.log(`[AI] Trying model=${model}, attempt=${attempt + 1}/${MAX_RETRIES}`);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                // Handle rate limiting with retry
                if (response.status === 429) {
                    const waitMs = Math.pow(2, attempt) * 2000;
                    console.log(`[AI] Rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} after ${waitMs}ms`);
                    lastError = 'Rate limited by Gemini API';
                    await new Promise(r => setTimeout(r, waitMs));
                    continue;
                }

                // Model not found — skip to fallback model
                if (response.status === 404) {
                    console.warn(`[AI] Model ${model} not found (404), trying next model...`);
                    lastError = `Model ${model} not available`;
                    break;
                }

                if (!response.ok) {
                    const errBody = await response.text();
                    console.error(`[AI] Gemini error (${response.status}) on ${model}:`, errBody);
                    
                    // For 400 errors (bad request), don't retry — it won't help
                    if (response.status === 400) {
                        return res.status(400).json({ 
                            error: `Request rejected by Gemini AI`,
                            details: errBody.substring(0, 200)
                        });
                    }
                    
                    lastError = `Gemini API error (${response.status})`;
                    continue;
                }

                const data = await response.json();
                
                // Check for blocked content
                if (data.promptFeedback?.blockReason) {
                    return res.status(400).json({ error: `Content blocked: ${data.promptFeedback.blockReason}` });
                }
                
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    console.log(`[AI] ✅ Success with model=${model}`);
                    return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
                } else if (data.candidates?.[0]?.finishReason === 'SAFETY') {
                    return res.status(400).json({ error: 'Response blocked by safety filters' });
                } else if (data.error) {
                    console.error("[AI] Gemini response error:", data.error);
                    lastError = data.error.message || 'AI generation failed';
                    continue;
                } else {
                    lastError = 'Empty response from AI';
                    continue;
                }

            } catch (error) {
                console.error(`[AI] Attempt ${attempt + 1} error on ${model}:`, error.message);
                lastError = error.message;
                if (attempt < MAX_RETRIES - 1) {
                    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
                }
            }
        }
    }

    // All models and retries exhausted
    return res.status(503).json({ 
        error: `AI temporarily unavailable. ${lastError || 'Please try again in a minute.'}` 
    });
}
