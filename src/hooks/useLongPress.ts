import { useCallback, useEffect, useRef } from 'react'
import { hapticTap } from '../lib/haptic'

type LongPressHandlers = {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
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

  const finish = useCallback(() => {
    const wasLong = longPressedRef.current
    clearTimer()
    if (!wasLong) pressRef.current?.()
  }, [clearTimer])

  const onPointerUp = useCallback(() => finish(), [finish])
  const onPointerCancel = useCallback(() => {
    longPressedRef.current = false
    clearTimer()
  }, [clearTimer])

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu }
}
