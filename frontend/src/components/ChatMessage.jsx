export default function ChatMessage({ message }) {
  return (
    <div className="p-3.5 px-4 rounded-[3px] bg-surface border border-border mb-2">
      <p className="text-sm leading-[1.65] text-text-primary">{message?.text}</p>
    </div>
  )
}
