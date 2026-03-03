export default function PersonaMini({ name, demo, onClick }) {
  return (
    <div
      className="py-3 px-3.5 border border-border rounded-[2px] mb-1.5 cursor-pointer transition-all hover:border-border-hover hover:bg-surface-hover"
      onClick={onClick}
    >
      <div className="text-sm font-semibold">{name}</div>
      <div className="text-xs text-text-muted mt-0.5">{demo}</div>
    </div>
  )
}
