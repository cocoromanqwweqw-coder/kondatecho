import { useCallback, useEffect, useRef } from 'react'
import { hapticTap } from '../lib/haptic'

type LongPressHandlers = {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onSelectStart: (e: React.SyntheticEvent) => void
}

function clearTextSelection() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return
  sel.removeAllRanges()
}

/** iOS は長押しのあと、画面が切り替わってから選択範囲を付ける */
function suppressSelectionBriefly() {
  clearTextSelection()
  const stop = (event: Event) => {
    event.preventDefault()
  }
  document.addEventListener('selectstart', stop, true)
  const timers = [0, 80, 200, 450].map((ms) => window.setTimeout(clearTextSelection, ms))
  window.setTimeout(() => {
    document.removeEventListener('selectstart', stop, true)
    for (const id of timers) window.clearTimeout(id)
    clearTextSelection()
  }, 700)
}

/** 長押しと通常タップを分ける（スマホ向け） */
export function useLongPress(
  onLongPress: () => void,
  onPress?: () => void,
  { delayMs = 480, moveThreshold = 12 }: { delayMs?: number; moveThreshold?: number } = {}
): LongPressHandlers {
  const longRef = useRef(onLongPress)
  const pressRef = useRef(onPress)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressedRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })

  longRef.current = onLongPress
  pressRef.current = onPress

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      longPressedRef.current = false
      startRef.current = { x: e.clientX, y: e.clientY }
      clearTimer()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        longPressedRef.current = true
        hapticTap('success')
        longRef.current()
        suppressSelectionBriefly()
      }, delayMs)
    },
    [clearTimer, delayMs]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!timerRef.current) return
      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y
      if (Math.hypot(dx, dy) > moveThreshold) clearTimer()
    },
    [clearTimer, moveThreshold]
  )

  const finish = useCallback(
    (e?: React.PointerEvent) => {
      const wasLong = longPressedRef.current
      clearTimer()
      if (wasLong) {
        e?.preventDefault()
        suppressSelectionBriefly()
        return
      }
      pressRef.current?.()
    },
    [clearTimer]
  )

  const onPointerUp = useCallback((e: React.PointerEvent) => finish(e), [finish])
  const onPointerCancel = useCallback(() => {
    longPressedRef.current = false
    clearTimer()
    clearTextSelection()
  }, [clearTimer])

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    clearTextSelection()
  }, [])

  const onSelectStart = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault()
  }, [])

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onContextMenu,
    onSelectStart,
  }
}
