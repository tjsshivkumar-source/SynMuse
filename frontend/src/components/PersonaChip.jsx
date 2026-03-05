import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function PersonaChip({ persona, selected, onToggle }) {
  const [tooltipPos, setTooltipPos] = useState(null)

  const handleMouseEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const left = Math.max(8, Math.min(r.left + r.width / 2 - 140, window.innerWidth - 288))
    setTooltipPos({ top: r.bottom + 10, left })
  }

  const handleMouseLeave = () => setTooltipPos(null)

  return (
    <>
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 border rounded-[2px] cursor-pointer transition-all flex-shrink-0 select-none ${
          selected
            ? 'border-text-muted bg-surface-active'
            : 'border-border bg-surface hover:border-text-muted hover:bg-surface-hover'
        }`}
        onClick={onToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="w-6 h-6 rounded-full bg-surface-active border border-border flex items-center justify-center text-[10px] font-semibold text-text-secondary flex-shrink-0">
          {persona.initial}
        </div>
        <span className="text-[13px] font-medium">{persona.name}</span>
        <span className="text-[11px] text-text-muted">{persona.age}</span>
      </div>

      {tooltipPos &&
        createPortal(
          <div
            className="fixed w-[280px] p-3.5 bg-surface border border-border-hover rounded-[3px] pointer-events-none"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              zIndex: 9999,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div className="text-[13px] font-semibold mb-1.5">
              {persona.name} — {persona.role}
            </div>
            <div className="text-xs text-text-muted leading-relaxed">{persona.tooltip}</div>
          </div>,
          document.body
        )}
    </>
  )
}
