export default async function handler(req, res) {
    // CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, image } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    const apiKey = process.env.WealthFlow_API_Key;

    if (!apiKey) {
        console.error('WealthFlow_API_Key environment variable is not set');
        return res.status(500).json({ error: 'Server configuration error: Missing API Key. Set WealthFlow_API_Key in Vercel Environment Variables.' });
    }

    try {
        // Build the request body
        const parts = [{ text: prompt }];
        
        // If an image was provided (base64), add it as inline_data
        if (image) {
            parts.push({
                inline_data: {
                    mime_type: "image/jpeg",
                    data: image
                }
            });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000
                    }
                })
            }
        );

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`Gemini API Error (${response.status}):`, errBody);
            return res.status(response.status).json({ 
                error: `Gemini API returned ${response.status}`,
                details: errBody
            });
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const reply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply });
        } else if (data.error) {
            console.error("Gemini response error:", data.error);
            return res.status(500).json({ error: data.error.message || 'AI generation failed' });
        } else {
            return res.status(500).json({ error: 'Empty response from AI provider' });
        }
    } catch (error) {
        console.error("AI Generation Error:", error);
        return res.status(500).json({ error: 'Failed to communicate with AI provider: ' + error.message });
    }
}
