import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { useAppState } from '../hooks/useAppState'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { DAYS } from '../types'
import { DayDetailPanel } from './DayDetailPanel'

type App = ReturnType<typeof useAppState>

interface Props {
  app: App
  dayIndex: number
  onClose: () => void
}

export function DayDetailSheet({ app, dayIndex, onClose }: Props) {
  useBodyScrollLock()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[55] flex flex-col items-start justify-start sm:items-center sm:justify-center sm:p-4"
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex h-[100lvh] max-h-[100lvh] w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-orange-100 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 id="day-detail-title" className="text-base font-bold text-gray-800">
            {DAYS[dayIndex]}曜の詳細
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <DayDetailPanel app={app} dayIndex={dayIndex} />
        </div>
      </div>
    </div>,
    document.body
  )
}
