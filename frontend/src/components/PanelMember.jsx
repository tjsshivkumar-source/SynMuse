export default function PanelMember({ persona, onRemove }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 border border-border rounded-[2px] mb-1.5 bg-surface">
      <div className="w-7 h-7 rounded-full bg-surface-active border border-border flex items-center justify-center text-[11px] font-semibold text-text-secondary flex-shrink-0">
        {persona.initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{persona.name}</div>
        <div className="text-[11px] text-text-muted">{persona.demo}</div>
      </div>
      <button
        onClick={onRemove}
        className="w-5 h-5 flex items-center justify-center text-text-muted text-sm rounded-[2px] flex-shrink-0 hover:text-text-primary hover:bg-surface-active transition-all"
      >
        ×
      </button>
    </div>
  )
}
