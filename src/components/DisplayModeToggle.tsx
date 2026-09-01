import { useDisplayMode, type DisplayMode } from '../hooks/useDisplayMode'

const OPTIONS: { id: DisplayMode; label: string; icon: string }[] = [
  { id: 'auto', label: '自動', icon: '⚙️' },
  { id: 'mobile', label: 'スマホ', icon: '📱' },
  { id: 'desktop', label: 'PC', icon: '🖥️' },
]

export function DisplayModeToggle() {
  const { mode, setMode } = useDisplayMode()

  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label="表示モード"
    >
      <span className="hidden text-xs text-neutral-400 sm:inline">表示</span>
      <div className="flex rounded-md border border-neutral-300 bg-white p-0.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMode(opt.id)}
            aria-pressed={mode === opt.id}
            title={`${opt.label}表示`}
            className={`rounded px-2 py-1 text-xs font-medium transition ${
              mode === opt.id
                ? 'bg-orange-500 text-orange-950'
                : 'text-neutral-500 hover:bg-orange-50 hover:text-orange-800'
            }`}
          >
            {opt.icon}
            <span className="ml-1 hidden min-[420px]:inline">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
