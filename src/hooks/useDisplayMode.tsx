import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type DisplayMode = 'auto' | 'mobile' | 'desktop'

const STORAGE_KEY = 'weekly-menu-display-mode'

function readStoredMode(): DisplayMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'mobile' || raw === 'desktop') return raw
    // 旧 auto もスマホ縦レイアウト前提
    if (raw === 'auto') return 'mobile'
  } catch {
    /* ignore */
  }
  return 'mobile'
}

function useViewportDesktop(): boolean {
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return wide
}

type DisplayModeContextValue = {
  mode: DisplayMode
  setMode: (mode: DisplayMode) => void
  isDesktopLayout: boolean
  isMobileLayout: boolean
}

const DisplayModeContext = createContext<DisplayModeContextValue | null>(null)

export function DisplayModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DisplayMode>(() => readStoredMode())
  const viewportDesktop = useViewportDesktop()

  const setMode = useCallback((next: DisplayMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const isDesktopLayout =
    mode === 'desktop' || (mode === 'auto' && viewportDesktop)
  const isMobileLayout = !isDesktopLayout

  const value = useMemo(
    () => ({ mode, setMode, isDesktopLayout, isMobileLayout }),
    [mode, setMode, isDesktopLayout, isMobileLayout]
  )

  return (
    <DisplayModeContext.Provider value={value}>{children}</DisplayModeContext.Provider>
  )
}

export function useDisplayMode() {
  const ctx = useContext(DisplayModeContext)
  if (!ctx) {
    throw new Error('useDisplayMode must be used within DisplayModeProvider')
  }
  return ctx
}
