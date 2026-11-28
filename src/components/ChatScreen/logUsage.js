// Reports one AI request to the admin log. Fire and forget: it never slows down or breaks the app.
export function logUsage(entry) {
  try {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* logging must never break the app */
  }
}