import type { AppState } from '../types'
import { snapshotForBackup, stateFromBackupPayload } from './storage'

export const BACKUP_KIND = 'kondatecho-backup'

export type BackupPayload = {
  kind: typeof BACKUP_KIND
  version: 1
  savedAt: string
  state: AppState
}

export function buildBackupPayload(state: AppState): BackupPayload {
  return {
    kind: BACKUP_KIND,
    version: 1,
    savedAt: new Date().toISOString(),
    state: snapshotForBackup(state),
  }
}

export function backupFileName(at = new Date()): string {
  const y = at.getFullYear()
  const m = String(at.getMonth() + 1).padStart(2, '0')
  const d = String(at.getDate()).padStart(2, '0')
  return `こんだて帳-${y}${m}${d}.json`
}

export function parseBackupFile(text: string): AppState | null {
  try {
    return stateFromBackupPayload(JSON.parse(text) as unknown)
  } catch {
    return null
  }
}

function backupFile(state: AppState): File {
  const body = JSON.stringify(buildBackupPayload(state), null, 2)
  return new File([body], backupFileName(), { type: 'application/json' })
}

export async function shareOrDownloadBackup(state: AppState): Promise<'shared' | 'downloaded'> {
  const file = backupFile(state)
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
  }
  if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
    await nav.share({
      files: [file],
      title: 'こんだて帳のバックアップ',
    })
    return 'shared'
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
