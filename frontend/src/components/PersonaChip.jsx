export default function PersonaChip({ name, age, selected }) {
  return (
    <div className={`inline-flex items-center gap-2 py-1.5 px-3.5 border rounded-[2px] cursor-grab transition-all shrink-0 ${
      selected
        ? 'border-text-muted bg-surface-active'
        : 'border-border bg-surface hover:border-text-muted hover:bg-surface-hover'
    }`}>
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold bg-surface-active text-text-secondary border border-border">
        {name?.[0]}
      </div>
      <span className="text-[13px] font-medium">{name}</span>
      <span className="text-[11px] text-text-muted">{age}</span>
    </div>
  )
}
