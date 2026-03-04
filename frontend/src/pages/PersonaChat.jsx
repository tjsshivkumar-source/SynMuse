import { useParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import ChatMessage from '../components/ChatMessage'

const PERSONAS = {
  sophie: {
    name: 'Sophie',
    initial: 'S',
    headerStatus: 'Trend-forward · 26 · London',
    detailDemo: 'Trend-forward early adopter · 26 · London',
    inputPlaceholder: 'Ask Sophie about a product concept...',
    profile: {
      income: '£45,000',
      shoppingBehaviour:
        'Early adopter. Follows TikTok trends. Shops Zara, COS, & Other Stories. Returns ~30% of online purchases.',
      personality:
        'Enthusiastic but critical. Excited by newness but has been burned by poor quality. Vocal about value for money.',
      styleIdentity:
        'Minimalist-leaning with trend accents. Quiet luxury aspirant on a high-street budget.',
    },
    sources: {
      summary: '2,847 discourse fragments from 3 sources',
      items: [
        {
          sub: 'r/femalefashionadvice',
          text: '"COS linen blazer was a total disappointment — the fabric was so thin you could see through it. At £79 I expected better."',
          score: '↑ 847 · 6 months ago',
        },
        {
          sub: 'r/femalefashionadvice',
          text: '"Is anyone else over sage green? Every brand has done it to death. Give me tobacco, olive, or even a warm grey."',
          score: '↑ 623 · 3 months ago',
        },
        {
          sub: 'r/femalefashionadvice',
          text: '"Just got the Arket relaxed blazer in tobacco and it\'s genuinely perfect. Great weight, patch pockets, works with everything."',
          score: '↑ 412 · 2 months ago',
        },
      ],
    },
    initialMessages: [
      {
        id: 1,
        type: 'user',
        text: "What do you think of a relaxed-fit linen blazer in sage green, priced at £89? It's targeting women 25–32, positioned as a COS competitor.",
        time: '2:34 PM',
      },
      {
        id: 2,
        type: 'persona',
        name: 'Sophie',
        initial: 'S',
        demo: '26, London',
        text: "Sage green linen blazer at £89 — honestly, my first reaction is \"haven't I seen this everywhere already?\" COS did their oversized linen blazer in a similar sage last spring and it went to sale within six weeks. The silhouette is safe, which is fine, but at that price you're competing directly with Arket and & Other Stories who are doing the same thing with better fabric weight. If you're going to do linen at this price, the colour needs to be unexpected — a tobacco or a washed terracotta would feel more current right now. I'd probably scroll past this one.",
        intent: 4,
        concern: 'Colour saturation',
        sources: [
          { source: 'r/femalefashionadvice', text: 'COS linen blazer — fabric so thin...', score: 847 },
        ],
      },
    ],
  },
  jordan: {
    name: 'Jordan',
    initial: 'J',
    headerStatus: 'Archive collector · 24 · East London',
    detailDemo: 'Archive collector · 24 · East London',
    inputPlaceholder: 'Ask Jordan about a product concept...',
    profile: {
      income: '£30,000',
      shoppingBehaviour:
        'Buys secondhand first. Grailed, Depop, vintage stores in Brick Lane. Will save for months for a grail piece. Knows fabric weights by feel.',
      personality:
        'Deeply knowledgeable, opinionated. Respects craft and provenance. Dismissive of brands that cut corners. Active on Reddit denim communities.',
      styleIdentity:
        'Japanese workwear meets London vintage. Heavy fabrics, muted palettes, patina-friendly pieces. Anti-trend but not anti-fashion.',
    },
    sources: {
      summary: '3,412 discourse fragments from 4 sources',
      items: [
        {
          sub: 'r/rawdenim',
          text: '"14oz is the sweet spot for year-round wear. Anything lighter feels like chinos, anything heavier is a commitment."',
          score: '↑ 1,203 · 4 months ago',
        },
        {
          sub: 'r/malefashionadvice',
          text: '"Grey selvedge is criminally underrated. Way more versatile than indigo for daily wear, pairs with everything."',
          score: '↑ 891 · 2 months ago',
        },
        {
          sub: 'r/rawdenim',
          text: '"Just because a brand uses Japanese fabric doesn\'t mean the construction is good. Check the stitching, the rivets, the chain stitch hem."',
          score: '↑ 567 · 5 months ago',
        },
      ],
    },
    initialMessages: [
      {
        id: 1,
        type: 'user',
        text: 'What do you think of a charcoal selvedge denim jean in a slim-straight cut, 12oz weight, priced at £75? Made in Portugal.',
        time: '3:12 PM',
      },
      {
        id: 2,
        type: 'persona',
        name: 'Jordan',
        initial: 'J',
        demo: '24, East London',
        text: "12oz charcoal selvedge at £75 from Portugal — okay, I'm listening, but I have questions. 12oz is light for selvedge; most of what I wear sits at 14-16oz. That's not necessarily bad — lighter weights are genuinely more wearable day-to-day — but you need to be upfront about it because the raw denim community will call you out immediately if you market this as a \"heavyweight\" option. Portugal is interesting; Bossa and Textil do solid work. Is the construction chain-stitched? That matters more than the fabric origin for how this'll wear and fade. At £75 you're undercutting Samurai and Oni significantly, which is either a value play or a quality flag. I'd need to handle it before I'd consider it.",
        intent: 6,
        concern: 'Fabric weight transparency',
        sources: [
          { source: 'r/rawdenim', text: '14oz is the sweet spot for year-round wear...', score: 1203 },
        ],
      },
    ],
  },
}

export default function PersonaChat() {
  const { slug } = useParams()
  const persona = PERSONAS[slug] || PERSONAS.sophie

  const [messages, setMessages] = useState(persona.initialMessages)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset messages when slug changes
  useEffect(() => {
    setMessages(PERSONAS[slug]?.initialMessages || PERSONAS.sophie.initialMessages)
    setInput('')
  }, [slug])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: 'user', text, time },
    ])
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Chat area */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-border bg-black">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-surface flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-surface-active border border-border flex items-center justify-center text-[13px] font-semibold text-text-secondary flex-shrink-0">
            {persona.initial}
          </div>
          <div>
            <div className="text-sm font-semibold">{persona.name}</div>
            <div className="text-xs text-text-muted">{persona.headerStatus}</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-surface">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-black border border-border rounded-[2px] px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-text-muted font-sans"
              placeholder={persona.inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSend}
              className="px-5 py-2.5 bg-white text-black rounded-[2px] text-xs font-semibold uppercase tracking-[0.5px] hover:opacity-85 transition-opacity whitespace-nowrap"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right: Detail panel */}
      <div className="w-[380px] min-w-[380px] bg-black-soft overflow-y-auto p-6">
        {/* Persona header */}
        <div className="mb-6">
          <div className="text-xl font-bold tracking-[0.5px] mb-0.5">{persona.name}</div>
          <div className="text-[13px] text-text-muted">{persona.detailDemo}</div>
        </div>

        {/* Profile section */}
        <div className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted mb-3">
            Profile
          </div>
          <div className="mb-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-[1px] text-text-muted mb-0.5">
              Income
            </div>
            <div className="text-[13px] text-text-secondary leading-relaxed">
              {persona.profile.income}
            </div>
          </div>
          <div className="mb-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-[1px] text-text-muted mb-0.5">
              Shopping Behaviour
            </div>
            <div className="text-[13px] text-text-secondary leading-relaxed">
              {persona.profile.shoppingBehaviour}
            </div>
          </div>
          <div className="mb-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-[1px] text-text-muted mb-0.5">
              Personality
            </div>
            <div className="text-[13px] text-text-secondary leading-relaxed">
              {persona.profile.personality}
            </div>
          </div>
          <div className="mb-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-[1px] text-text-muted mb-0.5">
              Style Identity
            </div>
            <div className="text-[13px] text-text-secondary leading-relaxed">
              {persona.profile.styleIdentity}
            </div>
          </div>
        </div>

        <div className="h-px bg-border mb-6" />

        {/* Data sources */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted mb-3">
            Data Sources
          </div>
          <div className="mb-3">
            <div className="text-[10px] font-semibold uppercase tracking-[1px] text-text-muted mb-0.5">
              Grounded in
            </div>
            <div className="text-[13px] text-text-secondary">{persona.sources.summary}</div>
          </div>
          <div className="flex flex-col gap-1.5 mt-3">
            {persona.sources.items.map((item, i) => (
              <div
                key={i}
                className="p-2.5 px-3 border border-border rounded-[2px] cursor-pointer transition-all hover:bg-surface-hover hover:border-border-hover"
              >
                <div className="text-[11px] font-semibold text-text-secondary mb-0.5">
                  {item.sub}
                </div>
                <div
                  className="text-xs text-text-muted leading-[1.4]"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
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
