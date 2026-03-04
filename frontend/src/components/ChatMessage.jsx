import IntentBar from './IntentBar'

function UserMessage({ message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[70%]">
        <div
          className="bg-white text-black px-4 py-2.5 text-sm leading-relaxed"
          style={{ borderRadius: '14px 14px 2px 14px' }}
        >
          {message.text}
        </div>
        {message.time && (
          <div className="text-right text-[11px] text-text-muted mt-1">{message.time}</div>
        )}
      </div>
    </div>
  )
}

function PersonaMessage({ message }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-full bg-surface-active border border-border flex items-center justify-center text-[11px] font-semibold text-text-secondary flex-shrink-0">
            {message.initial}
          </div>
          <div>
            <span className="text-[13px] font-semibold">{message.name}</span>
            {message.demo && (
              <span className="text-[11px] text-text-muted"> · {message.demo}</span>
            )}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-[3px] p-3.5 px-4">
          <p className="text-sm leading-[1.65] text-text-primary">{message.text}</p>
          {(message.intent != null || message.concern) && (
            <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-border">
              {message.intent != null && (
                <div className="text-[11px] text-text-secondary">
                  <span className="font-semibold uppercase tracking-[0.5px] text-text-muted mr-1">Intent</span>
                  <IntentBar value={message.intent} />
                  <span className="ml-1">{message.intent}/10</span>
                </div>
              )}
              {message.concern && (
                <div className="text-[11px] text-text-secondary">
                  <span className="font-semibold uppercase tracking-[0.5px] text-text-muted mr-1">Concern</span>
                  {message.concern}
                </div>
              )}
            </div>
          )}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-border flex flex-col gap-1">
              {message.sources.map((src, i) => (
                <div key={i} className="text-[11px] text-text-muted">
                  <span className="font-semibold text-text-secondary">{src.source}</span>
                  {src.score && <span> · ↑ {src.score}</span>}
                  {src.text && <span> — {src.text}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatMessage({ message }) {
  if (message.type === 'user') return <UserMessage message={message} />
  return <PersonaMessage message={message} />
}
