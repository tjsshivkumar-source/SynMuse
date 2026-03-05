import { useParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import ChatMessage from '../components/ChatMessage'
import { fetchPersona, sendChat } from '../api'

// Fallback data so the page still looks good without the backend
const FALLBACK = {
  sophie: {
    name: 'Sophie', initial: 'S',
    headerStatus: 'Trend-forward · 26 · London',
    detailDemo: 'Trend-forward early adopter · 26 · London',
    profile: {
      income: '£45,000',
      shoppingBehaviour: 'Early adopter. Follows TikTok trends. Shops Zara, COS, & Other Stories. Returns ~30% of online purchases.',
      personality: 'Enthusiastic but critical. Excited by newness but has been burned by poor quality. Vocal about value for money.',
      styleIdentity: 'Minimalist-leaning with trend accents. Quiet luxury aspirant on a high-street budget.',
    },
    sources: { summary: '2,847 discourse fragments from 3 sources', items: [] },
  },
  jordan: {
    name: 'Jordan', initial: 'J',
    headerStatus: 'Archive collector · 24 · East London',
    detailDemo: 'Archive collector · 24 · East London',
    profile: {
      income: '£30,000',
      shoppingBehaviour: 'Buys secondhand first. Grailed, Depop, vintage stores in Brick Lane. Will save for months for a grail piece.',
      personality: 'Deeply knowledgeable, opinionated. Respects craft and provenance. Dismissive of brands that cut corners.',
      styleIdentity: 'Japanese workwear meets London vintage. Heavy fabrics, muted palettes, patina-friendly pieces.',
    },
    sources: { summary: '3,412 discourse fragments from 4 sources', items: [] },
  },
}

function apiToDisplayPersona(data) {
  return {
    name: data.name,
    initial: data.name[0],
    headerStatus: `${data.style_descriptor} · ${data.age} · ${data.location}`,
    detailDemo: `${data.style_descriptor} · ${data.age} · ${data.location}`,
    profile: {
      income: data.income,
      shoppingBehaviour: data.profile?.shopping_behaviour ?? '',
      personality: data.profile?.personality ?? '',
      styleIdentity: data.profile?.style_identity ?? '',
    },
    sources: {
      summary: data.data_sources?.summary ?? '',
      items: (data.data_sources?.sources ?? []).map((s) => ({
        sub: s.source,
        text: `"${s.text}"`,
        score: `↑ ${s.score} · ${s.date}`,
      })),
    },
  }
}

function apiToMessage(data, personaName, personaInitial) {
  return {
    id: Date.now() + Math.random(),
    type: 'persona',
    name: personaName,
    initial: personaInitial,
    demo: '',
    text: data.response_text,
    intent: data.purchase_intent,
    concern: data.key_concern,
    sources: (data.referenced_sources ?? []).map((s) => ({
      source: s.source,
      text: s.text,
      score: s.score,
    })),
  }
}

function ProcessingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-surface border border-border rounded-[3px] px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-text-secondary"
            style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
        <style>{`@keyframes pulse-dot{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
      </div>
    </div>
  )
}

export default function PersonaChat() {
  const { slug } = useParams()
  const [persona, setPersona] = useState(FALLBACK[slug] || FALLBACK.sophie)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [responding, setResponding] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    setMessages([])
    setInput('')
    const fallback = FALLBACK[slug] || { name: slug, initial: slug[0].toUpperCase(), headerStatus: '', detailDemo: '', profile: { income: '', shoppingBehaviour: '', personality: '', styleIdentity: '' }, sources: { summary: '', items: [] } }
    setPersona(fallback)
    fetchPersona(slug)
      .then((data) => setPersona(apiToDisplayPersona(data)))
      .catch(() => {/* keep fallback */})
  }, [slug])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, responding])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || responding) return
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages((prev) => [...prev, { id: Date.now(), type: 'user', text, time }])
    setInput('')
    setResponding(true)
    try {
      const data = await sendChat(slug, text, [])
      setMessages((prev) => [...prev, apiToMessage(data, persona.name, persona.initial)])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), type: 'user', text: '⚠ Could not reach the API. Is the backend running?', time: '' },
      ])
    } finally {
      setResponding(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Chat area */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-border bg-black">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-surface flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-surface-active border border-border flex items-center justify-center text-[13px] font-semibold text-text-secondary flex-shrink-0">
            {persona.initial}
          </div>
          <div>
            <div className="text-sm font-semibold">{persona.name}</div>
            <div className="text-xs text-text-muted">{persona.headerStatus}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.length === 0 && !responding && (
            <div className="text-[13px] text-text-muted text-center mt-8">
              Ask {persona.name} about a product concept to get started.
            </div>
          )}
          {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
          {responding && <ProcessingDots />}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-surface">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-black border border-border rounded-[2px] px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-text-muted font-sans"
              placeholder={`Ask ${persona.name} about a product concept...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={responding}
            />
            <button
              onClick={handleSend}
              disabled={responding}
              className="px-5 py-2.5 bg-white text-black rounded-[2px] text-xs font-semibold uppercase tracking-[0.5px] hover:opacity-85 transition-opacity whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right: Detail panel */}
      <div className="w-[380px] min-w-[380px] bg-black-soft overflow-y-auto p-6">
        <div className="mb-6">
          <div className="text-xl font-bold tracking-[0.5px] mb-0.5">{persona.name}</div>
          <div className="text-[13px] text-text-muted">{persona.detailDemo}</div>
        </div>

        <div className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted mb-3">Profile</div>
          {[
            { label: 'Income', value: persona.profile.income },
            { label: 'Shopping Behaviour', value: persona.profile.shoppingBehaviour },
            { label: 'Personality', value: persona.profile.personality },
            { label: 'Style Identity', value: persona.profile.styleIdentity },
          ].map(({ label, value }) => (
            <div key={label} className="mb-3.5">
              <div className="text-[10px] font-semibold uppercase tracking-[1px] text-text-muted mb-0.5">{label}</div>
              <div className="text-[13px] text-text-secondary leading-relaxed">{value}</div>
            </div>
          ))}
        </div>

        <div className="h-px bg-border mb-6" />

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted mb-3">Data Sources</div>
          {persona.sources.summary && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-[1px] text-text-muted mb-0.5">Grounded in</div>
              <div className="text-[13px] text-text-secondary">{persona.sources.summary}</div>
            </div>
          )}
          <div className="flex flex-col gap-1.5 mt-3">
            {persona.sources.items.map((item, i) => (
              <div
                key={i}
                className="p-2.5 px-3 border border-border rounded-[2px] cursor-pointer transition-all hover:bg-surface-hover hover:border-border-hover"
              >
                <div className="text-[11px] font-semibold text-text-secondary mb-0.5">{item.sub}</div>
                <div
                  className="text-xs text-text-muted leading-[1.4]"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {item.text}
                </div>
                <div className="text-[11px] text-text-muted mt-1">{item.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
