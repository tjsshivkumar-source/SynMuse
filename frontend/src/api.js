const BASE_URL = 'http://localhost:8000'

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`)
  return res.json()
}

export const fetchPersonas = () => request('GET', '/api/personas')

export const fetchPersona = (slug) => request('GET', `/api/personas/${slug}`)

export const createPersona = (description, liveScrape = false) =>
  request('POST', '/api/personas/create', { description, live_scrape: liveScrape })

export const sendChat = (personaSlug, question, history = []) =>
  request('POST', '/api/chat/individual', {
    persona_slug: personaSlug,
    question,
    chat_history: history,
  })

export const sendPanelChat = (personaSlugs, question) =>
  request('POST', '/api/chat/panel', { persona_slugs: personaSlugs, question })
