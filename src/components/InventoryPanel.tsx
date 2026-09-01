import { useState } from 'react'
import type { useAppState } from '../hooks/useAppState'
import { useDisplayMode } from '../hooks/useDisplayMode'

type App = ReturnType<typeof useAppState>

const COMMON_ITEMS = [
  '鶏もも肉', '豚肉', '牛肉', '卵', '豆腐', '玉ねぎ', 'にんじん', 'じゃがいも',
  'キャベツ', 'ピーマン', 'トマト', 'キムチ', 'ご飯', 'パスタ', 'チーズ', 'エビ',
]

interface Props {
  app: App
}

export function InventoryPanel({ app }: Props) {
  const { state, addInventoryItem, removeInventoryItem, toggleInventoryWantToUse } = app
  const { isDesktopLayout } = useDisplayMode()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    addInventoryItem(name, quantity || undefined)
    setName('')
    setQuantity('')
  }

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-3.5 shadow-sm">
      <h2 className="text-base font-bold text-gray-800">在庫管理</h2>
      <p className="text-xs text-gray-500">
        🎯「使いたい」を付けると献立に優先されます
      </p>

      <div className="mt-2 flex gap-1.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="食材名（例: 鶏もも肉）"
          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <input
          type="text"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="量"
          className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 rounded-lg bg-orange-500 px-3 py-1 text-xs font-medium text-orange-950 transition hover:bg-orange-600"
        >
          追加
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-0.5">
        {COMMON_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => addInventoryItem(item)}
            className="rounded-md bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-600 transition hover:bg-orange-50 hover:text-orange-600"
          >
            + {item}
          </button>
        ))}
      </div>

      {state.inventory.length === 0 ? (
        <p className="mt-2 rounded-lg bg-gray-50 px-3 py-3 text-center text-xs text-gray-400">
          在庫が登録されていません
        </p>
      ) : (
        <ul
          className={`mt-2 max-h-52 overflow-y-auto ${
            isDesktopLayout
              ? 'grid grid-cols-3 gap-x-3 gap-y-0.5'
              : 'grid grid-cols-2 gap-x-2 gap-y-0.5'
          }`}
        >
          {state.inventory.map((item) => (
            <li key={item.id} className="flex min-w-0 items-center gap-1.5 py-0.5">
              <button
                type="button"
                onClick={() => toggleInventoryWantToUse(item.id)}
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[11px] leading-none transition ${item.wantToUse ? '' : 'opacity-30 grayscale'}`}
                title="使いたい"
              >
                🎯
              </button>
              <p
                className={`min-w-0 flex-1 truncate text-sm ${item.wantToUse ? 'text-amber-800' : 'text-gray-800'}`}
              >
                {item.name}
                {item.quantity ? (
                  <span className="ml-1 text-[11px] font-normal text-gray-400">
                    {item.quantity}
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                onClick={() => removeInventoryItem(item.id)}
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[11px] leading-none text-gray-300 transition hover:text-red-400"
                aria-label={`${item.name}を削除`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
