export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, systemPrompt } = req.body || {};

  if (!prompt || prompt.trim().length === 0)
    return res.status(400).json({ error: 'Prompt is required' });

  if (prompt.length > 8000)
    return res.status(400).json({ error: 'Prompt too long. Max 8000 characters.' });

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 6000,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(502).json({ error: `Groq API error ${groqRes.status}: ${errText}` });
    }

    const groqData = await groqRes.json();
    let raw = groqData.choices?.[0]?.message?.content || '';

    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Attempt to extract JSON from response
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); }
        catch { return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' }); }
      } else {
        return res.status(500).json({ error: 'AI returned invalid response. Please try again.' });
      }
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
