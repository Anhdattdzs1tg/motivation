import type { StreakState } from '../lib/types'

const NEXT_MILESTONES = [10, 30, 100, 200]

export default function StreakBanner({ streak }: { streak: StreakState | undefined }) {
  const current = streak?.currentStreak ?? 0
  const credits = streak?.recoveryCreditsRemaining ?? 0
  const nextMilestone = NEXT_MILESTONES.find((m) => m > current)

  return (
    <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 p-5 text-white shadow-lg shadow-sky-200 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/10" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sky-100 text-sm font-medium">Chuỗi hiện tại</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-4xl font-bold tabular-nums">{current}</span>
            <span className="text-sky-100 text-sm">ngày 🔥</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sky-100 text-sm font-medium">Lượt khôi phục</p>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <ShieldIcon />
            <span className="text-2xl font-bold tabular-nums">{credits}</span>
          </div>
        </div>
      </div>
      {nextMilestone && (
        <p className="relative text-xs text-sky-100 mt-3">
          Còn <span className="font-semibold text-white">{nextMilestone - current} ngày</span> nữa để đạt mốc {nextMilestone} ngày
        </p>
      )}
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.5 12 1.8 1.8L15 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
