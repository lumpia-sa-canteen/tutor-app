// Placeholder: no AI is connected yet.
// Later, replace the body of this function with a call to your AI.
// `history` is the whole conversation so far: [{ id, role: 'user' | 'bot', text }]
// Return the bot's reply as a string.
export async function getReply(history) {
  await new Promise((resolve) => setTimeout(resolve, 900));   // pretend it is thinking

  const last = history[history.length - 1]?.text ?? '';
  return `The AI is not connected yet, so I can only repeat you for now: "${last}"`;
}