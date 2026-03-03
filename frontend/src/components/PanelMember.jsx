export default function PanelMember({ name, demo, onRemove }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 px-3 border border-border rounded-[2px] mb-1.5 bg-surface">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 bg-surface-active text-text-secondary border border-border">
        {name?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{name}</div>
        <div className="text-[11px] text-text-muted">{demo}</div>
      </div>
      <div
        className="w-5 h-5 flex items-center justify-center cursor-pointer text-text-muted text-sm rounded-[2px] shrink-0 hover:text-text-primary hover:bg-surface-active"
        onClick={onRemove}
      >
        x
      </div>
    </div>
  )
}
