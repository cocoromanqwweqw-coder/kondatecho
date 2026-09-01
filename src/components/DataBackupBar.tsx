import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState } from '../types'
import { parseBackupFile, shareOrDownloadBackup } from '../lib/backup'

const WARNING_AT_KEY = 'weekly-menu-delete-warning-at'
const LAST_BACKUP_AT_KEY = 'weekly-menu-last-backup-at'
const OLD_WARNING_DAY_KEY = 'weekly-menu-delete-warning-day'
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000
const AFTER_BACKUP_MS = 30 * 24 * 60 * 60 * 1000

function readTime(key: string): number {
  try {
    const n = Number(localStorage.getItem(key) || 0)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function writeTime(key: string, at = Date.now()): void {
  try {
    localStorage.setItem(key, String(at))
  } catch {
    // ignore
  }
}

function shouldShowWarning(): boolean {
  const now = Date.now()
  try {
    const oldDay = localStorage.getItem(OLD_WARNING_DAY_KEY)
    if (oldDay) {
      localStorage.removeItem(OLD_WARNING_DAY_KEY)
      writeTime(WARNING_AT_KEY, now)
      return false
    }
  } catch {
    // ignore
  }
  if (now - readTime(LAST_BACKUP_AT_KEY) < AFTER_BACKUP_MS) return false
  if (now - readTime(WARNING_AT_KEY) < DISMISS_MS) return false
  return true
}

function markWarningSeen(): void {
  writeTime(WARNING_AT_KEY)
}

function markBackupSaved(): void {
  writeTime(LAST_BACKUP_AT_KEY)
  writeTime(WARNING_AT_KEY)
}

interface Props {
  state: AppState
  onRestore: (next: AppState) => void
}

export function DataBackupBar({ state, onRestore }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (shouldShowWarning()) setShowWarning(true)
  }, [])

  const dismissWarning = () => {
    markWarningSeen()
    setShowWarning(false)
  }

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const how = await shareOrDownloadBackup(state)
      markBackupSaved()
      setShowWarning(false)
      setMessage(
        how === 'shared'
          ? 'ファイルに保存したら、ホーム画面を消しても戻せます'
          : 'ダウンロードしたファイルを残しておいてください'
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setMessage('保存できませんでした。もう一度試してください')
    } finally {
      setBusy(false)
    }
  }

  const restoreFromFile = async (file: File) => {
    const text = await file.text()
    const next = parseBackupFile(text)
    if (!next) {
      setMessage('こんだて帳のバックアップファイルではありません')
      return
    }
    const ok = window.confirm(
      '今の献立・手入力・買い物メモを、ファイルの内容に置き換えますか？'
    )
    if (!ok) return
    onRestore(next)
    setMessage('バックアップから戻しました')
  }

  const warningDialog =
    showWarning &&
    createPortal(
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-warning-title"
        aria-describedby="delete-warning-body"
      >
        <div className="w-full max-w-sm rounded-2xl border border-orange-200 bg-white p-4 shadow-lg">
          <p className="text-xs font-semibold tracking-wide text-orange-700">注意</p>
          <h2 id="delete-warning-title" className="mt-1 text-lg font-bold text-gray-900">
            アプリを消す前に、保存してください
          </h2>
          <p id="delete-warning-body" className="mt-2 text-sm leading-relaxed text-gray-600">
            ホーム画面からこんだて帳を消すと、献立も手入力も一緒に消えます。消す前に「ファイルに保存」して、ファイルアプリに残してください。
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy}
              className="rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-medium text-orange-950 hover:bg-orange-600 disabled:opacity-50"
            >
              ファイルに保存
            </button>
            <button
              type="button"
              onClick={dismissWarning}
              className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              あとで
            </button>
          </div>
        </div>
      </div>,
      document.body
    )

  return (
    <>
      <div className="mt-3 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2.5">
        <p className="text-xs font-bold text-orange-900">アプリを消す前に、保存してください</p>
        <p className="mt-0.5 text-[11px] leading-snug text-orange-800/90">
          ホーム画面からアイコンを消すと、献立も手入力も消えます。
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-medium text-orange-950 hover:bg-orange-600 disabled:opacity-50"
          >
            ファイルに保存
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-orange-50"
          >
            ファイルから戻す
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void restoreFromFile(file)
            }}
          />
        </div>
        {message && <p className="mt-1.5 text-[11px] text-orange-900">{message}</p>}
      </div>
      {warningDialog}
    </>
  )
}
