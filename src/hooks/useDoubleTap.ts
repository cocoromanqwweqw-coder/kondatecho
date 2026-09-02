import { useCallback, useEffect, useRef } from 'react'

/** シングルタップとダブルタップを分ける（スマホ向け） */
export function useDoubleTap(
  onSingleTap: () => void,
  onDoubleTap: () => void,
  delayMs = 320
): () => void {
  const singleRef = useRef(onSingleTap)
  const doubleRef = useRef(onDoubleTap)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTapRef = useRef(0)

  singleRef.current = onSingleTap
  doubleRef.current = onDoubleTap

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < delayMs) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      lastTapRef.current = 0
      doubleRef.current()
      return
    }
    lastTapRef.current = now
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      singleRef.current()
    }, delayMs)
  }, [delayMs])
}
