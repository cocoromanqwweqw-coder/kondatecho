import { useEffect } from 'react'

let locks = 0

function lockBodyScroll() {
  locks += 1
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  locks = Math.max(0, locks - 1)
  if (locks > 0) return
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  const y = window.scrollY
  window.scrollTo(0, y)
  const active = document.activeElement
  if (active instanceof HTMLElement && active !== document.body) active.blur()
}

/** ポップアップが重なっても、全部閉じたらスクロールを戻す */
export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return
    lockBodyScroll()
    return unlockBodyScroll
  }, [active])
}
