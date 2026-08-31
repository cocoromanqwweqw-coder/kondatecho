import { useState } from 'react'
import type { useAppState } from '../hooks/useAppState'

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
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    addInventoryItem(name, quantity || undefined)
    setName('')
    setQuantity('')
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
        <h2 className="text-lg font-bold text-gray-800 mb-1">在庫管理</h2>
        <p className="text-sm text-gray-500 mb-4">
          冷蔵庫・パントリーの食材を登録。🎯「使いたい」を付けると献立に優先されます
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="食材名（例: 鶏もも肉）"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="量"
            className="w-20 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            onClick={handleAdd}
            className="px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition shrink-0"
          >
            追加
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {COMMON_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => addInventoryItem(item)}
              className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full hover:bg-orange-50 hover:text-orange-600 border border-gray-100 transition"
            >
              + {item}
            </button>
          ))}
        </div>
      </div>

      {state.inventory.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-orange-100">
          <p className="text-gray-400 text-sm">在庫が登録されていません</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 divide-y divide-gray-50">
          {state.inventory.map((item) => (
            <div key={item.id} className="px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => toggleInventoryWantToUse(item.id)}
                className={`text-lg transition ${item.wantToUse ? 'scale-110' : 'opacity-30 grayscale'}`}
                title="使いたい"
              >
                🎯
              </button>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-800">{item.name}</span>
                {item.quantity && (
                  <span className="text-sm text-gray-400 ml-2">{item.quantity}</span>
                )}
                {item.wantToUse && (
                  <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    使いたい
                  </span>
                )}
              </div>
              <button
                onClick={() => removeInventoryItem(item.id)}
                className="text-gray-300 hover:text-red-400 text-sm transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
