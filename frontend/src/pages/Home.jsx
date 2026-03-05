import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PersonaMini from '../components/PersonaMini'
import { fetchPersonas } from '../api'

const FALLBACK_PERSONAS = [
  { slug: 'sophie', name: 'Sophie', demo: '26 · London · £45K · Early adopter' },
  { slug: 'priya', name: 'Priya', demo: '31 · Manchester · £38K · Research-driven' },
  { slug: 'marcus', name: 'Marcus', demo: '22 · Birmingham · Student · Depop regular' },
  { slug: 'emma', name: 'Emma', demo: '34 · Edinburgh · £65K · Capsule wardrobe' },
  { slug: 'aisha', name: 'Aisha', demo: '19 · South London · Gap year · Impulse buyer' },
  { slug: 'diane', name: 'Diane', demo: '52 · Surrey · £58K · Brand loyal' },
  { slug: 'jordan', name: 'Jordan', demo: '24 · East London · £30K · Archive collector' },
  { slug: 'raj', name: 'Raj', demo: '29 · Leeds · £42K · Smart-casual office' },
  { slug: 'tom', name: 'Tom', demo: '37 · Bristol · £55K · Workwear heritage' },
]

const PANELS = [
  { slug: 'linen', name: 'SS26 Linen Range Panel', members: ['S', 'P', 'E', 'D'], lastActive: 'Last active 2h ago' },
  { slug: 'denim', name: 'AW26 Menswear Denim Panel', members: ['J', 'R', 'T', 'M'], lastActive: 'Last active 4h ago' },
  { slug: 'streetwear', name: 'Gen Z Streetwear Test', members: ['M', 'A', 'S'], lastActive: 'Last active 1d ago' },
]

function personaDemo(p) {
  return [p.age, p.location, p.income, p.style_descriptor].filter(Boolean).join(' · ')
}

export default function Home() {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState(FALLBACK_PERSONAS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPersonas()
      .then((data) =>
        setPersonas(data.map((p) => ({ slug: p.slug, name: p.name, demo: personaDemo(p) })))
      )
      .catch(() => {/* keep fallback */})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="h-full overflow-y-auto p-8 px-10">
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-[0.5px]">Your workspace</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Personas column */}
        <div className="bg-surface border border-border rounded-[3px] overflow-hidden">
          <div className="py-3.5 px-[18px] border-b border-border flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-secondary">Personas</div>
            <div className="text-[11px] text-text-muted bg-surface-active py-0.5 px-2 rounded-[2px]">{personas.length}</div>
          </div>
          <div className="p-2.5 max-h-[520px] overflow-y-auto">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="py-3 px-3.5 border border-border rounded-[2px] mb-1.5 animate-pulse">
                    <div className="h-3.5 bg-surface-active rounded w-1/3 mb-1.5" />
                    <div className="h-2.5 bg-surface-active rounded w-2/3" />
                  </div>
                ))
              : personas.map((p) => (
                  <PersonaMini
                    key={p.slug}
                    name={p.name}
                    demo={p.demo}
                    onClick={() => navigate(`/persona/${p.slug}`)}
                  />
                ))}
          </div>
        </div>

        {/* Panels column */}
        <div className="bg-surface border border-border rounded-[3px] overflow-hidden">
          <div className="py-3.5 px-[18px] border-b border-border flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-secondary">Panels</div>
            <div className="text-[11px] text-text-muted bg-surface-active py-0.5 px-2 rounded-[2px]">{PANELS.length}</div>
          </div>
          <div className="p-2.5 max-h-[520px] overflow-y-auto">
            <div
              className="py-6 px-[18px] border border-dashed border-border rounded-[2px] text-center cursor-pointer transition-all mb-1.5 hover:border-text-muted hover:bg-surface-hover"
              onClick={() => navigate('/panel/linen')}
            >
              <div className="text-[22px] mb-2 text-text-muted">⊕</div>
              <div className="text-[13px] font-semibold mb-1">Create new panel</div>
              <div className="text-xs text-text-muted leading-[1.4]">Assemble personas into a focus group and test product concepts</div>
            </div>
            {PANELS.map((panel) => (
              <div
                key={panel.slug}
                className="py-3 px-3.5 border border-border rounded-[2px] mb-1.5 cursor-pointer transition-all hover:border-border-hover hover:bg-surface-hover"
                onClick={() => navigate(`/panel/${panel.slug}`)}
              >
                <div className="text-sm font-semibold mb-1">{panel.name}</div>
                <div className="flex mb-1.5">
                  {panel.members.map((m, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-semibold bg-surface-active text-text-secondary"
                      style={{ marginLeft: i === 0 ? 0 : -4 }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-text-muted">{panel.lastActive}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Create column */}
        <div className="bg-surface border border-border rounded-[3px] overflow-hidden">
          <div className="py-3.5 px-[18px] border-b border-border flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-secondary">Create</div>
          </div>
          <div className="p-2.5">
            <div
              className="py-6 px-[18px] border border-dashed border-border rounded-[2px] text-center cursor-pointer transition-all mb-1.5 hover:border-text-muted hover:bg-surface-hover"
              onClick={() => navigate('/create')}
            >
              <div className="text-[22px] mb-2 text-text-muted">+</div>
              <div className="text-[13px] font-semibold mb-1">New persona</div>
              <div className="text-xs text-text-muted leading-[1.4]">Describe a consumer in natural language. We'll build their profile from real discourse data.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
