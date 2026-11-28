import process from 'node:process'
import { randomUUID } from 'node:crypto'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN,
})

const KEEP = 10000                                   // the newest 10,000 requests are kept

const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')
const int = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 0), 1e9) : 0
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const b = req.body && typeof req.body === 'object' ? req.body : {}

  const entry = {
    id: randomUUID(),
    t: Date.now(),                                   // the server's clock, not the user's
    mode: b.mode === 'lesson' ? 'lesson' : 'chat',
    tutor: text(b.tutor, 60),
    subject: text(b.subject, 60),
    codename: text(b.codename, 40),
    ok: b.ok === true,
    status: int(b.status),
    error: text(b.error, 30),
    model: text(b.model, 60),
    attempts: int(b.attempts),
    ms: int(b.ms),
    promptChars: int(b.promptChars),
    replyChars: int(b.replyChars),
    promptTokens: int(b.promptTokens),
    replyTokens: int(b.replyTokens),
    tokens: int(b.tokens),
    hasFile: b.hasFile === true,
    images: int(b.images),
  }

  // message text is only stored when you turn this on (LOG_PREVIEW=true in Vercel)
  if (process.env.LOG_PREVIEW === 'true') entry.preview = text(b.preview, 120)

  try {
    await redis.pipeline().lpush('usage:log', entry).ltrim('usage:log', 0, KEEP - 1).incr('usage:total').exec()
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('log failed', err)
    res.status(500).json({ ok: false })
  }
}