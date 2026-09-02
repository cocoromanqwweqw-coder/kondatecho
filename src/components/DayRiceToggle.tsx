interface Props {
  dayIndex: number
  riceIncluded: boolean
  onToggle: (dayIndex: number, included: boolean) => void
}

export function DayRiceToggle({ dayIndex, riceIncluded, onToggle }: Props) {
  return (
    <button
      type="button"
      aria-label={riceIncluded ? 'ご飯あり' : 'ご飯なし'}
      title={riceIncluded ? 'ご飯1杯をカロリーに含める' : 'ご飯なし'}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle(dayIndex, !riceIncluded)
      }}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] leading-none transition ${
        riceIncluded
          ? 'border-amber-400 bg-amber-100 shadow-sm'
          : 'border-gray-200 bg-gray-50 opacity-40 grayscale'
      }`}
    >
      🍚
    </button>
  )
}
