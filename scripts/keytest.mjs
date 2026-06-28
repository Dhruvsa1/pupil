import Anthropic from '@anthropic-ai/sdk'
const c = new Anthropic()
const r = await c.messages.create({
  model: 'claude-opus-4-8',
  max_tokens: 50,
  messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
})
const text = r.content.find((b) => b.type === 'text')?.text ?? '(no text)'
console.log('model:', r.model, '| reply:', text.trim(), '| stop:', r.stop_reason)
