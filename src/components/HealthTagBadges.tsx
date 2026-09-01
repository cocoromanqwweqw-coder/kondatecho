import type { HealthTag } from '../types'
import { HEALTH_TAG_SHORT } from '../types'

interface Props {
  tags?: HealthTag[]
  className?: string
  max?: number
}

export function HealthTagBadges({ tags, className = '', max = 4 }: Props) {
  if (!tags?.length) return null
  const visible = tags.slice(0, max)
  const rest = tags.length - visible.length

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {visible.map((tag) => (
        <span
          key={tag}
          className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200"
        >
          {HEALTH_TAG_SHORT[tag]}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 text-neutral-500">+{rest}</span>
      )}
    </div>
  )
}
