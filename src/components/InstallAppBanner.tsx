import { useEffect, useState } from 'react'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export function InstallAppBanner() {
  const [visible, setVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    if (isStandalone() || !isMobile()) return
    setIsIos(/iPhone|iPad|iPod/i.test(navigator.userAgent))
    setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-orange-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800">📱 アプリのように使う</p>
          <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">
            {isIos ? (
              <>
                Safari の <strong>共有</strong> → <strong>ホーム画面に追加</strong>
              </>
            ) : (
              <>
                メニューの <strong>ホーム画面に追加</strong> または <strong>アプリをインストール</strong>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
