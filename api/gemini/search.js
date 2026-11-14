/* global process */
// Vercel runs this as a server function at /api/gemini/search
// (vite.config.js runs the same file while you develop).
// It asks Gemini to answer with Google Search turned on, and sends back the answer plus
// the web sources. The AI key stays on the server.

export const config = { maxDuration: 60 };

// only these models may be used through this function
const MODELS = new Set(['gemini-flash-lite-latest', 'gemini-flash-latest']);

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    send(res, 405, { error: 'Use POST' });
    return;
  }

  const key = process.env.AI_API_KEY;
  if (!key) {
    send(res, 500, { error: 'AI_API_KEY is not set' });
    return;
  }

  const { model, system, messages } = req.body ?? {};
  if (!MODELS.has(model) || !Array.isArray(messages) || !messages.length) {
    send(res, 400, { error: 'Bad request' });
    return;
  }

  // [{ role: 'user' | 'assistant', content }] -> Gemini's own format
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content ?? '') }],
  }));

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          ...(system ? { systemInstruction: { parts: [{ text: String(system) }] } } : {}),
          contents,
          tools: [{ google_search: {} }],   // lets the model search Google when it helps
        }),
      }
    );

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok || !data) {
      send(res, upstream.ok ? 502 : upstream.status, {
        error: data?.error?.message ?? 'The AI service failed',
      });
      return;
    }

    const candidate = data.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim();

    if (!text) {
      send(res, 502, { error: 'The AI service sent an empty answer' });
      return;
    }

    // the web pages the answer is based on (empty when the model did not search)
    const meta = candidate?.groundingMetadata ?? {};
    const seen = new Set();
    const sources = [];
    for (const chunk of meta.groundingChunks ?? []) {
      const url = chunk?.web?.uri;
      if (!url || seen.has(url)) continue;
      seen.add(url);
      sources.push({ title: chunk.web.title || 'source', url });
    }

    send(res, 200, {
      text,
      sources: sources.slice(0, 6),
      queries: meta.webSearchQueries ?? [],
      // Google's required "Search Suggestions" (HTML), shown under the reply
      suggestions: meta.searchEntryPoint?.renderedContent ?? '',
    });
  } catch {
    send(res, 502, { error: 'Could not reach the AI service' });
  }
}