import { useParams, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import PersonaChip from '../components/PersonaChip'
import PanelMember from '../components/PanelMember'
import ChatMessage from '../components/ChatMessage'
import { sendPanelChat, fetchPersonas } from '../api'
import { addRecentVisit } from '../recents'
import { getPanel, savePanel, deletePanel as removePanelFromStorage, slugify } from '../panels'
import { generateReport } from '../reportGenerator'

const FALLBACK_PERSONAS = [
  {
    slug: 'sophie', initial: 'S', name: 'Sophie', age: 26,
    role: 'Trend-Forward', demo: '26 · Trend-forward',
    tooltip: 'Minimalist with trend accents. Shops COS, Zara, & Other Stories. Vocal about value for money.',
  },
  {
    slug: 'priya', initial: 'P', name: 'Priya', age: 31,
    role: 'Value Seeker', demo: '31 · Value seeker',
    tooltip: 'Research-driven buyer. Compares across brands. Never pays full price. Core quality over trend.',
  },
  {
    slug: 'emma', initial: 'E', name: 'Emma', age: 34,
    role: 'Luxury Adjacent', demo: '34 · Luxury adjacent',
    tooltip: 'Capsule wardrobe curator. Invests in fewer, better pieces. Aspiring to luxury, lives at Arket/COS.',
  },
  {
    slug: 'diane', initial: 'D', name: 'Diane', age: 52,
    role: 'Elevated Classic', demo: '52 · Elevated classic',
    tooltip: 'Brand loyal. Sticks to what she knows. M&S, John Lewis, occasional splurge on heritage British brands.',
  },
  {
    slug: 'jordan', initial: 'J', name: 'Jordan', age: 24,
    role: 'Archive Collector', demo: '24 · Archive collector',
    tooltip: 'Secondhand-first. Grailed, Depop. Deep knowledge of fabric and construction. Anti-fast fashion.',
  },
  {
    slug: 'raj', initial: 'R', name: 'Raj', age: 29,
    role: 'Smart-Casual', demo: '29 · Smart-casual',
    tooltip: 'Office-first. Buys coordinated sets. M&S, Next, occasional Ted Baker. Practicality over statement.',
  },
  {
    slug: 'tom', initial: 'T', name: 'Tom', age: 37,
    role: 'Workwear Heritage', demo: '37 · Workwear heritage',
    tooltip: 'Heavy fabrics, Barbour, Filson, Red Wing. Heritage over fashion. Buys once, keeps forever.',
  },
  {
    slug: 'marcus', initial: 'M', name: 'Marcus', age: 22,
    role: 'Streetwear', demo: '22 · Streetwear',
    tooltip: 'Supreme, Palace, Nike. Resells. Follows drops. Budget is flexible if the hype is right.',
  },
  {
    slug: 'aisha', initial: 'A', name: 'Aisha', age: 19,
    role: 'Gen Z', demo: '19 · Gen Z',
    tooltip: 'TikTok-first discovery. Sustainability aspirant on a student budget. Shein but conflicted.',
  },
]

function apiPersonaToChip(p) {
  return {
    slug: p.slug,
    initial: p.name[0].toUpperCase(),
    name: p.name,
    age: p.age || '',
    role: p.style_descriptor || '',
    demo: [p.age, p.style_descriptor].filter(Boolean).join(' · '),
    tooltip: [p.style_descriptor, p.location, p.income].filter(Boolean).join(' · '),
  }
}

// Pre-seeded demo conversations for linen and denim panels
const PANEL_CONFIG = {
  linen: {
    name: 'SS26 Linen Range Panel',
    defaultSlugs: ['sophie', 'priya', 'emma', 'diane'],
    messages: [
      {
        id: 1, type: 'user', time: '2:34 PM',
        text: "What do you think about a relaxed-fit linen blazer in sage green, priced at £89? It's targeting women 25–32, positioned as a COS competitor.",
      },
      {
        id: 2, type: 'persona', initial: 'S', name: 'Sophie', demo: '26, London · Trend-forward',
        text: "Sage green linen at £89 — I've literally seen this exact product from COS last spring. Same silhouette, same colourway, same price point. Unless you're offering something meaningfully different — better fabric, unusual detail, smarter colour — this is going to get lost in the noise. I'd probably scroll past it.",
        intent: 4, concern: 'Market saturation', sources: [],
      },
      {
        id: 3, type: 'persona', initial: 'P', name: 'Priya', demo: '31, Manchester · Value seeker',
        text: "£89 is the sweet spot where I start asking questions. At that price I'm comparing it directly with Mango, H&M Premium, and end-of-season COS. If the fabric is genuinely linen and not a linen-mix, that's a selling point — but you need to be transparent about the composition. The sage green I could take or leave. What matters to me is whether it goes through the wash without looking sad after two cycles.",
        intent: 6, concern: 'Fabric composition clarity', sources: [],
      },
      {
        id: 4, type: 'persona', initial: 'E', name: 'Emma', demo: '34, Edinburgh · Luxury adjacent',
        text: "If the cut is genuinely relaxed rather than just oversized, I'm interested. There's a difference between a blazer that drapes well with the right ease and one that just looks like it's two sizes too big. Sage green works if the shade is muted — I'd want to see how it photographs in natural light. At £89 you're competing with Arket's basics range, so the presentation and quality signals need to be immaculate.",
        intent: 7, concern: 'Fit precision', sources: [],
      },
      {
        id: 5, type: 'persona', initial: 'D', name: 'Diane', demo: '52, Surrey · Elevated classic',
        text: "I actually like this more than the younger options might. Sage green is timeless when it's the right tone — not too yellow, not too grey. Linen at £89 is reasonable if it's substantial. My concern is always the lining — unlined linen blazers crease terribly and look cheap by lunchtime. If it has even a partial lining and good button quality, this is something I'd try.",
        intent: 7, concern: 'Lining quality', sources: [],
      },
    ],
  },
  denim: {
    name: 'AW26 Menswear Denim Panel',
    defaultSlugs: ['jordan', 'raj', 'tom', 'marcus'],
    messages: [
      {
        id: 1, type: 'user', time: '3:12 PM',
        text: 'What do you think of a charcoal grey straight-leg baggy denim, 100% cotton, 12oz weight, priced at £75? Made in Portugal.',
      },
      {
        id: 2, type: 'persona', initial: 'J', name: 'Jordan', demo: '24, East London · Archive collector',
        text: "12oz charcoal at £75 — the weight is light for a raw denim product but not unreasonable for a daily-wear jean. Portugal is a legitimate manufacturing origin; some good mills there. My question is whether this is sanforized or raw, and whether the construction is chain-stitched. At this price point you're in Uniqlo selvedge territory, which is a hard benchmark to beat. I'd need to handle it.",
        intent: 6, concern: 'Construction transparency', sources: [],
      },
      {
        id: 3, type: 'persona', initial: 'R', name: 'Raj', demo: '29, Leeds · Smart-casual',
        text: "Charcoal is perfect for office wear — navy denim always reads too casual, charcoal bridges the gap. Straight-leg baggy is tricky for a formal environment but with the right shoe it works. £75 is fine if the quality is there. I'd probably buy it in both charcoal and navy if the fit is good. Made in Portugal is a reassuring signal.",
        intent: 8, concern: 'Smart-casual wearability', sources: [],
      },
      {
        id: 4, type: 'persona', initial: 'T', name: 'Tom', demo: '37, Bristol · Workwear heritage',
        text: "12oz is lightweight for what I look for. I wear 14-16oz as standard — you want fabric that holds shape and develops patina over years, not months. That said, charcoal is genuinely versatile and baggy straight is a good silhouette for workwear. Portugal production is solid. If the denim is midweight-heavy for its category and the rivets and stitching are quality, at £75 this is reasonable.",
        intent: 6, concern: 'Weight for longevity', sources: [],
      },
      {
        id: 5, type: 'persona', initial: 'M', name: 'Marcus', demo: '22, Birmingham · Streetwear',
        text: "Straight-leg baggy in charcoal is actually a solid colourway right now — black denim is everywhere but charcoal has more texture to it. £75 is accessible, not hype-priced. If the wash is right and there's no cringe branding, I'd consider it. Portugal doesn't mean anything to my audience though — we care about how it looks on, not where it's made. Needs strong visual on the product page to convert.",
        intent: 7, concern: 'Visual branding', sources: [],
      },
    ],
  },
}

export default function PanelChat() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isNew = slug === 'new'

  // Load panel from localStorage, fallback to PANEL_CONFIG for demo panels
  const savedPanel = !isNew ? getPanel(slug) : null
  const config = PANEL_CONFIG[slug] || null

  const initialName = savedPanel?.name || config?.name || ''
  const initialSlugs = savedPanel?.personaSlugs || config?.defaultSlugs || []

  const [allPersonas, setAllPersonas] = useState(FALLBACK_PERSONAS)
  const [panelName, setPanelName] = useState(isNew ? '' : initialName)
  const [selectedSlugs, setSelectedSlugs] = useState(new Set(initialSlugs))
  const [messages, setMessages] = useState(() => {
    if (isNew) return []
    try {
      const saved = localStorage.getItem(`chat_panel_${slug}`)
      return saved ? JSON.parse(saved) : (config?.messages || [])
    } catch { return config?.messages || [] }
  })
  const [input, setInput] = useState('')
  const [responding, setResponding] = useState(false)
  const [editingName, setEditingName] = useState(isNew)
  const messagesEndRef = useRef(null)
  const slugRef = useRef(slug)
  slugRef.current = slug

  // Fetch all personas from API (so newly created ones appear)
  useEffect(() => {
    fetchPersonas()
      .then((data) => {
        const fallbackMap = Object.fromEntries(FALLBACK_PERSONAS.map((p) => [p.slug, p]))
        const merged = data.map((p) => fallbackMap[p.slug] || apiPersonaToChip(p))
        // Add any fallback personas not returned by API (offline safety)
        const seenSlugs = new Set(data.map((p) => p.slug))
        for (const fb of FALLBACK_PERSONAS) {
          if (!seenSlugs.has(fb.slug)) merged.push(fb)
        }
        setAllPersonas(merged)
      })
      .catch(() => {/* keep fallback */})
  }, [])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0 && slugRef.current !== 'new') {
      localStorage.setItem(`chat_panel_${slugRef.current}`, JSON.stringify(messages))
    }
  }, [messages])

  // Reset when panel slug changes
  useEffect(() => {
    if (slug === 'new') {
      setSelectedSlugs(new Set())
      setMessages([])
      setPanelName('')
      setEditingName(true)
      setInput('')
      return
    }
    const panel = getPanel(slug)
    const c = PANEL_CONFIG[slug] || null
    const slugs = panel?.personaSlugs || c?.defaultSlugs || []
    setPanelName(panel?.name || c?.name || slug)
    setSelectedSlugs(new Set(slugs))
    try {
      const saved = localStorage.getItem(`chat_panel_${slug}`)
      setMessages(saved ? JSON.parse(saved) : (c?.messages || []))
    } catch { setMessages(c?.messages || []) }
    setInput('')
    setEditingName(false)
    addRecentVisit(`/panel/${slug}`, panel?.name || c?.name || slug, '◻')
  }, [slug])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, responding])

  // Persist persona selection to saved panel
  useEffect(() => {
    if (isNew || !panelName.trim()) return
    const existing = getPanel(slug)
    if (existing) {
      savePanel({ ...existing, personaSlugs: [...selectedSlugs] })
    }
  }, [selectedSlugs])

  const togglePersona = (personaSlug) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(personaSlug)) next.delete(personaSlug)
      else next.add(personaSlug)
      return next
    })
  }

  const selectedPersonas = allPersonas.filter((p) => selectedSlugs.has(p.slug))
  const headerStatus = selectedPersonas.map((p) => p.name).join(', ')

  const handleSavePanel = () => {
    const name = panelName.trim()
    if (!name) return
    const panelSlug = isNew ? slugify(name) : slug
    savePanel({
      slug: panelSlug,
      name,
      personaSlugs: [...selectedSlugs],
      createdAt: Date.now(),
    })
    if (isNew) {
      navigate(`/panel/${panelSlug}`, { replace: true })
    }
  }

  const handleDeletePanel = () => {
    if (!window.confirm(`Delete panel "${panelName}"? This cannot be undone.`)) return
    removePanelFromStorage(slug)
    navigate('/')
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || responding || selectedSlugs.size === 0) return

    // Auto-save panel if it's new and has a name
    if (isNew && panelName.trim()) {
      handleSavePanel()
    }

    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages((prev) => [...prev, { id: Date.now(), type: 'user', text, time }])
    setInput('')
    setResponding(true)
    try {
      const data = await sendPanelChat([...selectedSlugs], text)
      const personaMap = Object.fromEntries(allPersonas.map((p) => [p.slug, p]))
      const responseMessages = (data.responses ?? []).map((r) => {
        const p = personaMap[r.persona] ?? {}
        return {
          id: Date.now() + Math.random(),
          type: 'persona',
          name: r.name ?? p.name ?? r.persona,
          initial: (r.name ?? p.name ?? r.persona)[0].toUpperCase(),
          demo: r.style_descriptor ? `${r.age}, ${r.style_descriptor}` : '',
          text: r.response_text,
          intent: r.purchase_intent,
          concern: r.key_concern,
          sources: [],
        }
      })
      setMessages((prev) => [...prev, ...responseMessages])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), type: 'error', text: 'Could not reach the API. Is the backend running?' },
      ])
    } finally {
      setResponding(false)
    }
  }

  const handleExport = () => {
    const html = generateReport(messages, panelName)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `synmuse-report-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isSaved = !isNew && !!getPanel(slug)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Persona bar */}
      <div
        className="flex items-center gap-2 px-6 py-3 border-b border-border bg-surface flex-shrink-0 overflow-x-auto overflow-y-visible scrollbar-persona"
        style={{ paddingBottom: 14, zIndex: 50, position: 'relative' }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted flex-shrink-0 mr-1">
          Personas
        </span>
        {allPersonas.map((persona) => (
          <PersonaChip
            key={persona.slug}
            persona={persona}
            selected={selectedSlugs.has(persona.slug)}
            onToggle={() => togglePersona(persona.slug)}
          />
        ))}
      </div>

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Panel members sidebar */}
        <div className="w-[280px] min-w-[280px] border-r border-border bg-black-soft flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex-shrink-0">
            <div className="text-[11px] font-semibold uppercase tracking-[1px] mb-1">Panel Members</div>
            <div className="text-xs text-text-muted">{selectedPersonas.length} selected</div>
          </div>
          <div className="flex-1 p-3 overflow-y-auto scrollbar-thin-y">
            {selectedPersonas.map((persona) => (
              <PanelMember
                key={persona.slug}
                persona={persona}
                onRemove={() => togglePersona(persona.slug)}
              />
            ))}
            <div className="border border-dashed border-border rounded-[2px] p-5 text-center text-text-muted text-[13px] hover:border-text-muted transition-all cursor-default">
              + Click a persona above to add
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 min-w-0 flex flex-col bg-black overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-surface flex-shrink-0">
            <div className="flex-1 min-w-0">
              {editingName ? (
                <input
                  autoFocus
                  className="text-sm font-semibold bg-surface border border-border rounded-[2px] px-2 py-0.5 text-text-primary outline-none focus:border-text-muted font-sans w-full max-w-[300px]"
                  placeholder="Panel name..."
                  value={panelName}
                  onChange={(e) => setPanelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { handleSavePanel(); setEditingName(false) }
                    if (e.key === 'Escape') setEditingName(false)
                  }}
                  onBlur={() => { if (!isNew) setEditingName(false) }}
                />
              ) : (
                <div
                  className="text-sm font-semibold cursor-pointer hover:text-text-secondary transition-colors"
                  onClick={() => setEditingName(true)}
                  title="Click to rename"
                >
                  {panelName || 'Untitled Panel'}
                </div>
              )}
              <div className="text-xs text-text-muted">
                {headerStatus || 'No personas selected'}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleExport}
                disabled={messages.filter(m => m.type === 'persona').length === 0}
                className="px-3 py-1.5 border border-border rounded-[2px] text-[11px] text-text-secondary uppercase tracking-[0.5px] hover:border-border-hover hover:text-text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Export
              </button>
              {!isSaved && (
                <button
                  onClick={handleSavePanel}
                  disabled={!panelName.trim() || selectedSlugs.size === 0}
                  className="px-4 py-1.5 bg-white text-black rounded-[2px] text-[11px] font-semibold uppercase tracking-[0.5px] hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save Panel
                </button>
              )}
              {!isNew && (
                <button
                  onClick={handleDeletePanel}
                  className="px-3 py-1.5 text-text-muted text-[11px] border border-border rounded-[2px] hover:text-red-400 hover:border-red-400/50 transition-all"
                  title="Delete panel"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin-y p-6 flex flex-col gap-4">
            {messages.length === 0 && !responding && (
              <div className="text-[13px] text-text-muted text-center mt-8">
                {isNew ? 'Add personas above, name your panel, then ask a question.' : 'Ask the panel a question to get started.'}
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {responding && (
              <div className="text-[13px] text-text-muted flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-text-secondary"
                    style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
                <span>Generating panel responses...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-surface">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-black border border-border rounded-[2px] px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-text-muted font-sans"
                placeholder={selectedSlugs.size === 0 ? 'Select personas first...' : 'Ask the panel a question...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={responding || selectedSlugs.size === 0}
              />
              <button
                onClick={handleSend}
                disabled={responding || selectedSlugs.size === 0}
                className="px-5 py-2.5 bg-white text-black rounded-[2px] text-xs font-semibold uppercase tracking-[0.5px] hover:opacity-85 transition-opacity whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
