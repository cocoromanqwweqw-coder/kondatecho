import { useAppState } from './hooks/useAppState'
import { useDisplayMode } from './hooks/useDisplayMode'
import { ShoppingMemoPanel } from './components/ShoppingMemoPanel'
import { DataBackupBar } from './components/DataBackupBar'
import { InstallAppBanner } from './components/InstallAppBanner'
import { DisplayModeToggle } from './components/DisplayModeToggle'
import { useEffect, useState, useCallback } from 'react'
import { scheduleRecipeRefresh } from './lib/recipeCatalog'
import { useIosInputZoomReset } from './hooks/useIosInputZoomReset'

export default function App() {
  const app = useAppState()
  const { mode } = useDisplayMode()
  const [customEditorId, setCustomEditorId] = useState<string | undefined>()

  const consumeCustomEditor = useCallback(() => {
    setCustomEditorId(undefined)
  }, [])

  useIosInputZoomReset()

  useEffect(() => {
    scheduleRecipeRefresh()
  }, [])

  const shellClass =
    mode === 'mobile'
      ? 'mx-auto min-h-screen max-w-[430px] overflow-hidden border-x border-orange-200/80 bg-canvas'
      : mode === 'desktop'
        ? 'min-w-[1024px]'
        : 'min-h-screen'

  const outerClass =
    mode === 'mobile'
      ? 'min-h-screen bg-canvas'
      : mode === 'desktop'
        ? 'min-h-screen overflow-x-auto bg-canvas'
        : 'min-h-screen bg-canvas'

  return (
    <div className={outerClass}>
      <div className={shellClass}>
        <div className="min-h-screen bg-canvas pb-8 text-neutral-900">
          <header className="border-b border-orange-200/70 bg-canvas">
            <div className="mx-auto max-w-6xl px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <img
                    src="/pwa-icon.svg?v=21"
                    alt="こんだて帳"
                    width={48}
                    height={48}
                    className="mt-0.5 h-12 w-12 shrink-0 rounded-[22%] border border-neutral-200 bg-white"
                  />
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-black">こんだて帳</h1>
                    <p className="mt-1 text-sm text-neutral-500">
                      今週の献立を組んで、買い物メモまでまとめて管理
                    </p>
                  </div>
                </div>
                <DisplayModeToggle />
              </div>
              <DataBackupBar state={app.state} onRestore={app.replaceState} />
            </div>
          </header>

          <main className="mx-auto mt-6 max-w-6xl px-4">
            <ShoppingMemoPanel
              app={app}
              customEditorId={customEditorId}
              onCustomEditorConsumed={consumeCustomEditor}
            />
          </main>
          <InstallAppBanner />
        </div>
      </div>
    </div>
  )
}
