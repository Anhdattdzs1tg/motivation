import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { useStreak } from '../hooks/useLiveData'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export default function History() {
  const [monthCursor, setMonthCursor] = useState(new Date())
  const streak = useStreak()

  const monthStart = startOfMonth(monthCursor)
  const monthEnd = endOfMonth(monthCursor)
  const monthKey = format(monthCursor, 'yyyy-MM')

  const records = useLiveQuery(
    () => db.dayRecords.where('date').startsWith(monthKey).toArray(),
    [monthKey],
    [],
  )
  const recordMap = useMemo(() => new Map(records.map((r) => [r.date, r])), [records])

  const allRecords = useLiveQuery(() => db.dayRecords.toArray(), [], [])
  const stats = useMemo(() => {
    const total = allRecords.length
    const completed = allRecords.filter((r) => r.allCompleted).length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, rate }
  }, [allRecords])

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const leadingBlanks = getDay(monthStart)
  const todayKey = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="pb-4">
      <header className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-sky-900">Lịch sử &amp; Thống kê</h1>
      </header>

      <div className="grid grid-cols-3 gap-3 px-5 mt-3">
        <StatCard label="Streak dài nhất" value={`${streak?.longestStreak ?? 0}`} suffix="ngày" />
        <StatCard label="Tỷ lệ hoàn thành" value={`${stats.rate}%`} />
        <StatCard label="Lượt khôi phục" value={`${streak?.recoveryCreditsRemaining ?? 0}`} suffix="còn lại" />
      </div>

      <div className="mx-5 mt-5 bg-white rounded-2xl border border-sky-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonthCursor((m) => subMonths(m, 1))} className="p-1.5 text-sky-500 active:scale-90 transition-transform">
            <ChevronIcon dir="left" />
          </button>
          <span className="font-semibold text-sky-900 text-sm">{format(monthCursor, 'MM/yyyy')}</span>
          <button onClick={() => setMonthCursor((m) => addMonths(m, 1))} className="p-1.5 text-sky-500 active:scale-90 transition-transform">
            <ChevronIcon dir="right" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="text-center text-[11px] font-medium text-sky-400 py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`b${i}`} />
          ))}
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const rec = recordMap.get(key)
            const isToday = key === todayKey
            let cls = 'bg-sky-50 text-sky-400'
            if (rec) {
              if (rec.allCompleted && !rec.usedRecovery) cls = 'bg-success-500 text-white'
              else if (rec.usedRecovery) cls = 'bg-glow-400 text-white'
              else cls = 'bg-danger-500/15 text-danger-600'
            }
            return (
              <div
                key={key}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${cls} ${
                  isToday ? 'ring-2 ring-sky-500 ring-offset-1' : ''
                }`}
              >
                {format(d, 'd')}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-sky-500">
          <Legend color="bg-success-500" label="Hoàn thành" />
          <Legend color="bg-glow-400" label="Đã khôi phục" />
          <Legend color="bg-danger-500/40" label="Bỏ lỡ" />
          <Legend color="bg-sky-50 border border-sky-200" label="Chưa tới" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="bg-white rounded-xl border border-sky-100 p-3 text-center">
      <p className="text-lg font-bold text-sky-900 tabular-nums">{value}</p>
      {suffix && <p className="text-[10px] text-sky-400">{suffix}</p>}
      <p className="text-[11px] text-sky-500 mt-0.5">{label}</p>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      {label}
    </div>
  )
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
