interface Props {
  enabled: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function RiceBowlToggle({
  enabled,
  onToggle,
  size = 'md',
  showLabel = false,
  className = '',
}: Props) {
  const dim = size === 'sm' ? 22 : 28

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      title={enabled ? '茶碗のご飯あり（タップでオフ）' : '茶碗のご飯なし（タップでオン）'}
      aria-label={enabled ? '茶碗のご飯をオフにする' : '茶碗のご飯をオンにする'}
      aria-pressed={enabled}
      className={`inline-flex items-center gap-1 rounded-lg border transition ${
        enabled
          ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
      } ${size === 'sm' ? 'px-1 py-0.5' : 'px-1.5 py-1'} ${className}`}
    >
      <RiceBowlIcon enabled={enabled} size={dim} />
      {showLabel && (
        <span
          className={`text-[10px] font-medium leading-none ${
            enabled ? 'text-amber-800' : 'text-gray-400'
          }`}
        >
          茶碗
        </span>
      )}
    </button>
  )
}

function RiceBowlIcon({ enabled, size }: { enabled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={`shrink-0 transition ${enabled ? '' : 'opacity-45 grayscale'}`}
    >
      <ellipse cx="16" cy="26" rx="11" ry="3" fill={enabled ? '#d6d3d1' : '#e7e5e4'} />
      <path
        d="M5 15 C5 24 10 27 16 27 C22 27 27 24 27 15 L25 13 C25 22 21 24 16 24 C11 24 7 22 7 13 Z"
        fill={enabled ? '#f5f5f4' : '#e7e5e4'}
        stroke={enabled ? '#d97706' : '#a8a29e'}
        strokeWidth="1.2"
      />
      <ellipse cx="16" cy="14" rx="9" ry="4.5" fill={enabled ? '#fef9c3' : '#d6d3d1'} />
      <ellipse cx="16" cy="13" rx="7" ry="3" fill={enabled ? '#fde68a' : '#d4d4d4'} />
      <circle cx="12" cy="12.5" r="1.2" fill={enabled ? '#fbbf24' : '#a8a29e'} />
      <circle cx="16" cy="11.5" r="1.3" fill={enabled ? '#f59e0b' : '#a8a29e'} />
      <circle cx="20" cy="12.5" r="1.1" fill={enabled ? '#fbbf24' : '#a8a29e'} />
      <circle cx="14" cy="14" r="0.9" fill={enabled ? '#fcd34d' : '#a8a29e'} />
      <circle cx="18" cy="14" r="1" fill={enabled ? '#fcd34d' : '#a8a29e'} />
    </svg>
  )
}
