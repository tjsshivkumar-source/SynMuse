import { useState, useRef } from 'react'

const MOCK_PREVIEW = {
  description:
    "A budget-conscious creative professional navigating the tension between quiet luxury aspirations and high-street reality. She's deeply online — her taste is shaped by TikTok micro-trends and Pinterest mood boards — but she's developed a sharp eye for quality within her price range. Shops strategically: invests in footwear as statement pieces while keeping basics functional and affordable. Sustainability is a genuine value but not a dealbreaker when something good is on sale. She's the person who can spot the difference between COS and Totême at twenty paces but will always buy the COS version.",
  attrs: [
    { label: 'Age & Location', value: '28 · East London' },
    { label: 'Est. Income', value: '£32–38K' },
    { label: 'Key Brands', value: 'COS, Weekday, Arket, vintage, Depop' },
    { label: 'Style Identity', value: 'Quiet luxury on a budget · Scandi-minimalist with vintage accents' },
    { label: 'Shopping Triggers', value: 'TikTok virality, end-of-season sales, unique footwear, vintage finds' },
    { label: 'Pain Points', value: 'Quality inconsistency at mid-range, sustainability guilt, fast fashion temptation' },
  ],
}

function ProcessingDots() {
  return (
    <div className="flex items-center gap-3 p-4 px-[18px] bg-surface border border-border rounded-[3px] mt-5">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-text-secondary"
            style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
      <span className="text-[13px] text-text-muted">Building persona from consumer discourse...</span>
      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export default function CreatePersona() {
  const [description, setDescription] = useState(
    "A 28-year-old creative professional in East London who shops at Weekday, COS and vintage stores. She's into the 'quiet luxury' aesthetic but can't actually afford luxury brands. Spends a lot on shoes but less on basics. Gets most fashion inspiration from TikTok and Pinterest. Sustainability matters to her but she's realistic about budget constraints."
  )
  const [phase, setPhase] = useState('input') // 'input' | 'loading' | 'preview'
  const [personaName, setPersonaName] = useState('')
  const previewRef = useRef(null)

  const handleGenerate = () => {
    if (!description.trim()) return
    setPhase('loading')
    setTimeout(() => {
      setPhase('preview')
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }, 2000)
  }

  const handleRegenerate = () => {
    setPhase('loading')
    setTimeout(() => setPhase('preview'), 2000)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[720px] mx-auto py-10 px-6">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold tracking-[0.5px]">Create a persona</h1>
        </div>

        {/* Step 1 */}
        <div className="bg-surface border border-border rounded-[3px] p-6 mb-5">
          <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted mb-3.5">
            Step 1 — Describe
          </div>
          <textarea
            className="w-full min-h-[120px] bg-black border border-border rounded-[2px] px-4 py-3.5 text-sm leading-[1.6] text-text-primary placeholder-text-muted outline-none focus:border-text-muted resize-y font-sans"
            placeholder="e.g., A 28-year-old creative professional in East London who shops at Weekday, COS and vintage stores..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="text-xs text-text-muted mt-2 leading-[1.4]">
            Be as specific as you want — brands, income level, shopping habits, style references, personality traits.
          </div>
          <button
            onClick={handleGenerate}
            disabled={phase === 'loading'}
            className="mt-4 px-7 py-3 bg-white text-black rounded-[2px] text-[13px] font-semibold uppercase tracking-[0.5px] hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate persona →
          </button>
        </div>

        {/* Loading state */}
        {phase === 'loading' && <ProcessingDots />}

        {/* Step 2 — Preview */}
        {phase === 'preview' && (
          <div ref={previewRef}>
            <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted mb-3">
              Step 2 — Review &amp; Save
            </div>
            <div className="bg-surface border border-border-hover rounded-[3px] overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-6 py-3.5 bg-surface-active border-b border-border">
                <span className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted">
                  Generated Persona
                </span>
                <span className="text-[11px] text-text-muted">Grounded in 1,923 discourse fragments</span>
              </div>

              {/* Card body */}
              <div className="p-6">
                {/* Name input */}
                <input
                  type="text"
                  className="text-xl font-bold border-0 border-b-2 border-border pb-1 bg-transparent text-text-primary outline-none placeholder-text-muted tracking-[0.5px] focus:border-text-muted transition-colors font-sans w-[200px]"
                  placeholder="Name this persona..."
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                />

                {/* Generated description */}
                <div className="mt-4 p-4 bg-black border border-border rounded-[2px] text-sm leading-[1.7] text-text-secondary">
                  {MOCK_PREVIEW.description}
                </div>

                {/* Attribute grid */}
                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  {MOCK_PREVIEW.attrs.map((attr) => (
                    <div key={attr.label} className="p-3 px-3 border border-border rounded-[2px]">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-text-muted mb-0.5">
                        {attr.label}
                      </div>
                      <div className="text-[13px] text-text-secondary">{attr.value}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-5 pt-5 border-t border-border">
                  <button
                    onClick={handleRegenerate}
                    className="px-5 py-2.5 bg-transparent text-text-secondary border border-border rounded-[2px] text-xs font-medium hover:border-text-muted hover:text-text-primary transition-all"
                  >
                    ← Regenerate
                  </button>
                  <button className="px-5 py-2.5 bg-transparent text-text-secondary border border-border rounded-[2px] text-xs font-medium hover:border-text-muted hover:text-text-primary transition-all">
                    Edit details
                  </button>
                  <button className="px-6 py-2.5 bg-white text-black rounded-[2px] text-xs font-semibold uppercase tracking-[0.5px] hover:opacity-85 transition-opacity">
                    Save persona
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
