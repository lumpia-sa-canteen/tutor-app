// Vercel runs this as a server function at /api/ai/chat/completions.
// It forwards the chat to Gemini, keeps the AI key on the server,
// and writes one entry per request to the Firebase usage log that the admin site reads.

import process from 'node:process'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'

export const config = { maxDuration: 60 };   // pictures can take a while

// connects once; returns null if the Firebase variables are missing (logging is then skipped)
function getDb() {
  try {
    if (!getApps().length) {
      const {
        FIREBASE_PROJECT_ID: projectId,
        FIREBASE_CLIENT_EMAIL: clientEmail,
        FIREBASE_PRIVATE_KEY: rawKey,
        FIREBASE_DATABASE_URL: databaseURL,
      } = process.env
      if (!projectId || !clientEmail || !rawKey || !databaseURL) return null

      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey: rawKey.replace(/\\n/g, '\n') }),
        databaseURL,
      })
    }
    return getDatabase()
  } catch (err) {
    console.error('firebase init failed', err)
    return null
  }
}

const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')
const int = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 0), 1e9) : 0
}

// counts characters and pictures in the request, and checks whether the newest message had a file
function measure(messages) {
  const list = Array.isArray(messages) ? messages : []
  let chars = 0
  let images = 0

  const textOf = (m) => {
    if (typeof m?.content === 'string') return m.content
    if (Array.isArray(m?.content)) {
      return m.content.map((p) => (p?.type === 'text' && typeof p.text === 'string' ? p.text : '')).join('')
    }
    return ''
  }

  for (const m of list) {
    chars += textOf(m).length
    if (Array.isArray(m?.content)) images += m.content.filter((p) => p?.type === 'image_url').length
  }

  const lastUser = [...list].reverse().find((m) => m?.role === 'user')
  return { chars, images, hasFile: textOf(lastUser).includes('[Attached file:') }
}

// writes one entry; a logging problem must never break the tutor
async function logEntry(entry) {
  const db = getDb()
  if (!db) return
  try {
    await Promise.all([
      db.ref('usage/log').push(entry),                              // Firebase makes the entry's id
      db.ref('usage/total').transaction((n) => (n || 0) + 1),
    ])
  } catch (err) {
    console.error('usage log failed', err)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  const key = process.env.AI_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'AI_API_KEY is not set on Vercel' });
    return;
  }

  const started = Date.now()
  const model = req.body?.model
  const meta = req.body?.meta && typeof req.body.meta === 'object' ? req.body.meta : {}
  const sent = measure(req.body?.messages)

  // the parts of the entry that do not depend on Gemini's answer
  const entry = {
    t: Date.now(),                                   // the server's clock, not the user's
    mode: meta.mode === 'lesson' ? 'lesson' : 'chat',
    tutor: text(meta.tutor, 60),
    subject: text(meta.subject, 60),
    codename: text(meta.codename, 40),
    model: text(model, 60),
    attempts: 1,
    promptChars: sent.chars,
    hasFile: sent.hasFile,
    images: sent.images,
  }

  // message text is only stored when you turn this on (LOG_PREVIEW=true in Vercel)
  if (process.env.LOG_PREVIEW === 'true') entry.preview = text(meta.preview, 120)

  try {
    const upstream = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        // only pass on what the app needs (the meta stays here)
        body: JSON.stringify({
          model,
          messages: req.body?.messages,
        }),
      }
    );

    const body = await upstream.text();

    // work out what Gemini reported
    let reply = ''
    let usage = {}
    if (upstream.ok) {
      try {
        const data = JSON.parse(body)
        reply = data.choices?.[0]?.message?.content ?? ''
        usage = data.usage ?? {}
      } catch {
        /* not JSON: the entry just has no token numbers */
      }
    }

    await logEntry({
      ...entry,
      ok: upstream.ok,
      status: upstream.status,
      error: upstream.ok ? '' : `http_${upstream.status}`,
      ms: Date.now() - started,
      replyChars: typeof reply === 'string' ? reply.length : 0,
      promptTokens: int(usage.prompt_tokens),
      replyTokens: int(usage.completion_tokens),
      tokens: int(usage.total_tokens),
    })

    res
      .status(upstream.status)
      .setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
      .send(body);
  } catch {
    await logEntry({
      ...entry,
      ok: false,
      status: 502,
      error: 'unreachable',
      ms: Date.now() - started,
      replyChars: 0,
      promptTokens: 0,
      replyTokens: 0,
      tokens: 0,
    })
    res.status(502).json({ error: 'Could not reach the AI service' });
  }
}