/** 対応端末では短い振動。iPhone の Safari は振動 API が使えない */
export function hapticTap(kind: 'light' | 'success' = 'light'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    if (kind === 'success') navigator.vibrate([8, 24, 12])
    else navigator.vibrate(10)
  } catch {
    // 未対応
  }
}

/** iPhone は touchstart がないと :active の押し込みが見えない */
export function enablePressFeedback(): void {
  document.addEventListener('touchstart', () => {}, { passive: true })
}
