import { useAppState } from './hooks/useAppState'
import { useDisplayMode } from './hooks/useDisplayMode'
import { WeeklyPlan } from './components/WeeklyPlan'
import { InventoryPanel } from './components/InventoryPanel'
import { RecipeSearch } from './components/RecipeSearch'
import { InstallAppBanner } from './components/InstallAppBanner'
import { DisplayModeToggle } from './components/DisplayModeToggle'
import { useState } from 'react'

type Tab = 'plan' | 'inventory' | 'search'

type SearchEntry = {
  token: number
  query: string
}

export type GoSearchOptions = {
  query?: string
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'plan', label: '週間献立', icon: '📅' },
  { id: 'inventory', label: '在庫', icon: '🥬' },
  { id: 'search', label: 'レシピ検索', icon: '🔍' },
]

export default function App() {
  const app = useAppState()
  const { mode } = useDisplayMode()
  const [tab, setTab] = useState<Tab>('plan')
  const [searchEntry, setSearchEntry] = useState<SearchEntry>({
    token: 0,
    query: '',
  })

  const selectTab = (id: Tab) => {
    setTab(id)
  }

  const goSearch = (options?: string | GoSearchOptions) => {
    const opts =
      typeof options === 'string' ? { query: options } : (options ?? {})
    const trimmed = opts.query?.trim()
    setSearchEntry((prev) => ({
      token: trimmed !== undefined ? prev.token + 1 : prev.token,
      query: trimmed ?? prev.query,
    }))
    setTab('search')
  }

  const goPlan = () => {
    setTab('plan')
  }

  const shellClass =
    mode === 'mobile'
      ? 'mx-auto min-h-screen max-w-[430px] border-x border-orange-100/80 bg-white shadow-xl'
      : mode === 'desktop'
        ? 'min-w-[1024px]'
        : 'min-h-screen'

  const outerClass =
    mode === 'mobile'
      ? 'min-h-screen bg-slate-100'
      : mode === 'desktop'
        ? 'min-h-screen overflow-x-auto'
        : 'min-h-screen'

  return (
    <div className={outerClass}>
      <div className={shellClass}>
        <div className="min-h-screen pb-8">
          <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
            <div className="mx-auto max-w-6xl px-4 py-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-tight">🍳 献立プランナー</h1>
                  <p className="mt-1 text-base text-orange-100">
                    お気に入りをつけて、主食・主菜・副菜をドラッグして週間献立を組み立て
                  </p>
                </div>
                <DisplayModeToggle />
              </div>
            </div>
          </header>

          <nav className="mx-auto mt-4 max-w-6xl px-4">
            <div className="flex gap-2 rounded-2xl border border-orange-100 bg-white/80 p-1.5 shadow-sm backdrop-blur">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTab(t.id)}
                  className={`flex-1 rounded-xl px-3 py-3 text-base font-medium transition-all ${
                    tab === t.id
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </nav>

          <main className="mx-auto mt-6 max-w-6xl px-4">
            <div className={tab === 'plan' ? '' : 'hidden'}>
              <WeeklyPlan app={app} onGoSearch={goSearch} />
            </div>
            <div className={tab === 'inventory' ? '' : 'hidden'}>
              <InventoryPanel app={app} />
            </div>
            <div className={tab === 'search' ? '' : 'hidden'}>
              <RecipeSearch
                key={searchEntry.token}
                app={app}
                initialQuery={searchEntry.query}
                onBackToPlan={goPlan}
              />
            </div>
          </main>
          <InstallAppBanner />
        </div>
      </div>
    </div>
  )
}
