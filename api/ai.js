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
        console.error('WealthFlow_API_Key not set in environment');
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

    // Retry logic with exponential backoff for 429 rate limits
    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                }
            );

            // Handle rate limiting with retry
            if (response.status === 429) {
                const waitMs = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
                console.log(`[AI] Rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} after ${waitMs}ms`);
                lastError = 'Rate limited by Gemini API';
                await new Promise(r => setTimeout(r, waitMs));
                continue;
            }

            if (!response.ok) {
                const errBody = await response.text();
                console.error(`[AI] Gemini error (${response.status}):`, errBody);
                return res.status(response.status).json({ 
                    error: `Gemini API error (${response.status})`,
                    details: errBody.substring(0, 200)
                });
            }

            const data = await response.json();
            
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
            } else if (data.error) {
                console.error("[AI] Gemini response error:", data.error);
                return res.status(500).json({ error: data.error.message || 'AI generation failed' });
            } else {
                return res.status(500).json({ error: 'Empty response from AI' });
            }

        } catch (error) {
            console.error(`[AI] Attempt ${attempt + 1} error:`, error.message);
            lastError = error.message;
            if (attempt < MAX_RETRIES - 1) {
                await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
            }
        }
    }

    // All retries exhausted
    return res.status(503).json({ 
        error: `AI temporarily unavailable after ${MAX_RETRIES} attempts. ${lastError || 'Please try again in a minute.'}` 
    });
}
