import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from 'react'

const IGNORE_SELECTOR =
  'input, textarea, select, option, button, a, [contenteditable="true"], [draggable="true"], [data-no-swipe]'

export function useSwipeTabs<T extends string>(
  tabs: readonly T[],
  tab: T,
  onChange: (next: T) => void
) {
  const index = Math.max(0, tabs.indexOf(tab))
  const indexRef = useRef(index)
  indexRef.current = index

  const startX = useRef(0)
  const startY = useRef(0)
  const widthRef = useRef(1)
  const active = useRef(false)
  const axis = useRef<'undecided' | 'x' | 'y'>('undecided')

  const [shift, setShift] = useState(0)
  const [snapping, setSnapping] = useState(true)

  const finish = useCallback(
    (dx: number, width: number) => {
      const i = indexRef.current
      const threshold = Math.min(72, width * 0.18)
      let next = i
      if (dx < -threshold && i < tabs.length - 1) next = i + 1
      else if (dx > threshold && i > 0) next = i - 1
      setSnapping(true)
      setShift(0)
      if (next !== i) onChange(tabs[next])
    },
    [onChange, tabs]
  )

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const target = e.target as HTMLElement | null
    if (target?.closest(IGNORE_SELECTOR)) return
    active.current = true
    axis.current = 'undecided'
    startX.current = e.clientX
    startY.current = e.clientY
    widthRef.current = e.currentTarget.clientWidth || 1
    setSnapping(false)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!active.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    if (axis.current === 'undecided') {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      axis.current = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y'
      if (axis.current === 'y') {
        active.current = false
        setShift(0)
        return
      }
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // 合成イベントなど
      }
    }
    if (axis.current !== 'x') return
    e.preventDefault()
    const i = indexRef.current
    let x = dx
    if ((i === 0 && x > 0) || (i === tabs.length - 1 && x < 0)) x *= 0.28
    setShift(x)
  }

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (!active.current) return
    const wasX = axis.current === 'x'
    active.current = false
    axis.current = 'undecided'
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (wasX) finish(e.clientX - startX.current, widthRef.current)
    else {
      setSnapping(true)
      setShift(0)
    }
  }

  const trackStyle: CSSProperties = {
    transform: `translate3d(calc(${-index * 100}% + ${shift}px), 0, 0)`,
    transition: snapping ? 'transform 280ms ease-out' : 'none',
  }

  return {
    index,
    trackStyle,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  }
}
