import { useAppState } from './hooks/useAppState'
import { useDisplayMode } from './hooks/useDisplayMode'
import { WeeklyPlan } from './components/WeeklyPlan'
import { ShoppingMemoPanel } from './components/ShoppingMemoPanel'
import { DataBackupBar } from './components/DataBackupBar'
import { InstallAppBanner } from './components/InstallAppBanner'
import { DisplayModeToggle } from './components/DisplayModeToggle'
import { useEffect, useState, useCallback } from 'react'
import { scheduleRecipeRefresh } from './lib/recipeCatalog'
import { useSwipeTabs } from './hooks/useSwipeTabs'
import { useIosInputZoomReset } from './hooks/useIosInputZoomReset'

type Tab = 'plan' | 'shopping'

const TAB_IDS = ['plan', 'shopping'] as const

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'plan', label: '週間献立', icon: '📅' },
  { id: 'shopping', label: '買い物メモ', icon: '🛒' },
]

export default function App() {
  const app = useAppState()
  const { mode } = useDisplayMode()
  const [tab, setTab] = useState<Tab>('plan')
  const [customEditorId, setCustomEditorId] = useState<string | undefined>()

  const consumeCustomEditor = useCallback(() => {
    setCustomEditorId(undefined)
  }, [])

  const selectTab = (id: Tab) => {
    setTab(id)
  }

  const goPlan = () => {
    setTab('plan')
  }

  const swipe = useSwipeTabs(TAB_IDS, tab, selectTab)
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
                    src="/pwa-icon.svg?v=11"
                    alt="こんだて帳"
                    width={48}
                    height={48}
                    className="mt-0.5 h-12 w-12 shrink-0 rounded-[22%] border border-neutral-200 bg-white"
                  />
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-black">こんだて帳</h1>
                    <p className="mt-1 text-sm text-neutral-500">
                      お気に入りをつけて、主食・主菜・副菜をドラッグして週間献立を組み立て
                    </p>
                  </div>
                </div>
                <DisplayModeToggle />
              </div>
              <DataBackupBar state={app.state} onRestore={app.replaceState} />
            </div>
          </header>

          <nav className="mx-auto mt-4 max-w-6xl px-4">
            <div className="flex gap-1 border-b border-orange-200/70">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTab(t.id)}
                  className={`flex-1 px-2 py-2.5 text-sm font-medium transition-colors min-[400px]:px-3 min-[400px]:text-base ${
                    tab === t.id
                      ? 'border-b-2 border-orange-500 text-orange-800'
                      : 'border-b-2 border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </nav>

          <main className="mx-auto mt-6 max-w-6xl px-4">
            <div
              className="tab-pager w-full min-w-0 max-w-full overflow-hidden touch-pan-y"
              onPointerDown={swipe.onPointerDown}
              onPointerMove={swipe.onPointerMove}
              onPointerUp={swipe.onPointerUp}
              onPointerCancel={swipe.onPointerCancel}
            >
              <div
                className="tab-pager-track flex min-w-0"
                style={swipe.trackStyle}
              >
                <div
                  className="tab-pager-page min-w-0"
                  aria-hidden={tab !== 'plan'}
                >
                  <WeeklyPlan
                    app={app}
                    customEditorId={customEditorId}
                    onCustomEditorConsumed={consumeCustomEditor}
                  />
                </div>
                <div
                  className="tab-pager-page min-w-0"
                  aria-hidden={tab !== 'shopping'}
                >
                  <ShoppingMemoPanel
                    app={app}
                    onGoPlan={goPlan}
                    onOpenCustomPanel={setCustomEditorId}
                  />
                </div>
              </div>
            </div>
          </main>
          <InstallAppBanner />
        </div>
      </div>
    </div>
  )
}
