import type { useAppState } from '../hooks/useAppState'
import { DAYS, GENRES, GENRE_SHORT, isDayGenreEnabled } from '../types'

type App = ReturnType<typeof useAppState>

interface Props {
  app: App
  dayIndex?: number
  compact?: boolean
}

export function DayGenreSettings({ app, dayIndex, compact = false }: Props) {
  const { state, toggleDayGenre, setAllDayGenres } = app
  const { dayDisabledGenres } = state

  const hasAnyDisabled = Object.values(dayDisabledGenres).some((list) => (list?.length ?? 0) > 0)

  if (compact && dayIndex !== undefined) {
    const enabledCount = GENRES.filter((g) =>
      isDayGenreEnabled(dayIndex, g, dayDisabledGenres)
    ).length
    const allOn = enabledCount === GENRES.length

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 shrink-0 text-xs font-medium text-gray-500">
          {DAYS[dayIndex]}のジャンル
        </span>
        {GENRES.map((genre) => {
          const on = isDayGenreEnabled(dayIndex, genre, dayDisabledGenres)
          return (
            <button
              key={genre}
              type="button"
              onClick={() => toggleDayGenre(dayIndex, genre)}
              aria-label={`${DAYS[dayIndex]}曜 ${genre} ${on ? 'オフにする' : 'オンにする'}`}
              title={genre}
              className={`h-8 min-w-[2rem] rounded-lg px-1.5 text-[10px] font-medium transition-all sm:h-9 sm:min-w-[2.25rem] sm:text-xs ${
                on
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {GENRE_SHORT[genre]}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setAllDayGenres(dayIndex, !allOn)}
          title={allOn ? 'すべてオフ' : 'すべてオン'}
          className={`ml-1 h-8 min-w-[2rem] rounded-lg px-1.5 text-xs font-medium transition sm:h-9 ${
            allOn ? 'text-gray-400 hover:bg-gray-100' : 'text-orange-600 bg-orange-50'
          }`}
        >
          {allOn ? '−' : '✓'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-orange-100">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800">曜日別ジャンル設定</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            タップでオン/オフ。オフのジャンルはその日の献立に出ません
          </p>
        </div>
        {hasAnyDisabled && (
          <button
            onClick={() => DAYS.forEach((_, i) => setAllDayGenres(i, true))}
            className="text-xs text-orange-600 hover:text-orange-700 px-2 py-1 rounded-lg hover:bg-orange-50"
          >
            すべてリセット
          </button>
        )}
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[280px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="text-left py-1 pr-1 text-gray-400 font-normal w-7">曜</th>
              {GENRES.map((genre) => (
                <th
                  key={genre}
                  className="py-1 px-0 text-center text-gray-500 font-normal w-7"
                  title={genre}
                >
                  {GENRE_SHORT[genre]}
                </th>
              ))}
              <th className="py-1 pl-0.5 text-gray-400 font-normal w-6">全</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, idx) => {
              const enabledCount = GENRES.filter((g) =>
                isDayGenreEnabled(idx, g, dayDisabledGenres)
              ).length
              const allOn = enabledCount === GENRES.length

              return (
                <tr key={day} className="border-t border-gray-50">
                  <td className="py-1.5 pr-1 font-medium text-orange-600">{day}</td>
                  {GENRES.map((genre) => {
                    const on = isDayGenreEnabled(idx, genre, dayDisabledGenres)
                    return (
                      <td key={genre} className="py-1.5 px-0 text-center">
                        <button
                          type="button"
                          onClick={() => toggleDayGenre(idx, genre)}
                          aria-label={`${day}曜 ${genre} ${on ? 'オフにする' : 'オンにする'}`}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md text-[9px] sm:text-[10px] font-medium transition-all ${
                            on
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {GENRE_SHORT[genre]}
                        </button>
                      </td>
                    )
                  })}
                  <td className="py-1.5 pl-0.5 text-center">
                    <button
                      type="button"
                      onClick={() => setAllDayGenres(idx, !allOn)}
                      title={allOn ? 'すべてオフ' : 'すべてオン'}
                      className={`w-5 h-5 rounded text-[9px] transition ${
                        allOn
                          ? 'text-gray-400 hover:bg-gray-100'
                          : 'text-orange-600 bg-orange-50'
                      }`}
                    >
                      {allOn ? '−' : '✓'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {hasAnyDisabled && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {DAYS.map((day, idx) => {
            const disabled = dayDisabledGenres[idx] ?? []
            if (disabled.length === 0) return null
            const enabled = GENRES.filter((g) => !disabled.includes(g))
            return (
              <span
                key={day}
                className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full"
              >
                {day}: {enabled.map((g) => GENRE_SHORT[g]).join('')}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
