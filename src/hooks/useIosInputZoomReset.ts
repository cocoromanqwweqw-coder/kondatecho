import { useEffect } from 'react'

const VIEWPORT =
  'width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover'

function isFormField(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

function setViewport(content: string) {
  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return
  meta.setAttribute('content', content)
}

/** iPhone は入力後に拡大したまま戻さないことがあるので、viewport を叩き直す */
function resetZoom() {
  setViewport(`${VIEWPORT}, user-scalable=0`)
  window.scrollTo(0, window.scrollY)
  window.setTimeout(() => {
    setViewport(VIEWPORT)
    window.scrollTo(0, window.scrollY)
  }, 50)
}

export function useIosInputZoomReset() {
  useEffect(() => {
    setViewport(VIEWPORT)

    const onFocusOut = (event: FocusEvent) => {
      if (!isFormField(event.target)) return
      resetZoom()
    }

    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])
}
