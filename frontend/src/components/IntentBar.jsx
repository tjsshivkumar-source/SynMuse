export default function IntentBar({ value, max = 10 }) {
  const pct = (value / max) * 100
  return (
    <span className="inline-block h-[5px] rounded-[2px] bg-surface-active w-[60px] relative align-middle">
      <span
        className="absolute left-0 top-0 h-full rounded-[2px] bg-white"
        style={{ width: `${pct}%` }}
      />
    </span>
  )
}
