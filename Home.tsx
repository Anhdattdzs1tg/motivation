import { useMemo, useState } from 'react'
import StreakBanner from '../components/StreakBanner'
import TaskRow from '../components/TaskRow'
import PeriodCountdown from '../components/PeriodCountdown'
import AddTaskModal from '../components/AddTaskModal'
import PomodoroModal from '../components/PomodoroModal'
import { useTodayInstances, useStreak } from '../hooks/useLiveData'
import { formatVietnameseDate, todayStr } from '../lib/dateUtils'
import { PERIOD_LABELS } from '../lib/types'
import type { Period, TaskInstance } from '../lib/types'

const PERIOD_ORDER: Period[] = ['morning', 'flexible', 'afternoon', 'evening']

export default function Home() {
  const instances = useTodayInstances()
  const streak = useStreak()
  const [showAddTask, setShowAddTask] = useState(false)
  const [showPomodoro, setShowPomodoro] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<Period, TaskInstance[]>()
    for (const p of PERIOD_ORDER) map.set(p, [])
    for (const inst of instances ?? []) {
      map.get(inst.period)?.push(inst)
    }
    return map
  }, [instances])

  const total = instances?.length ?? 0
  const done = instances?.filter((i) => i.status === 'done').length ?? 0

  return (
    <div className="pb-4">
      <header className="px-5 pt-6 pb-1">
        <p className="text-sm text-sky-500">{formatVietnameseDate(todayStr())}</p>
        <h1 className="text-2xl font-bold text-sky-900 mt-0.5">Nhiệm vụ hôm nay</h1>
        <p className="text-[11px] tracking-wide text-glow-600 font-semibold mt-1.5 bg-glow-50 inline-block px-2.5 py-1 rounded-full">
          ✦ ANHDATDZS1TG#15
        </p>
      </header>

      <StreakBanner streak={streak} />

      <div className="mx-5 mt-4 flex items-center justify-between text-sm">
        <span className="text-sky-600 font-medium">
          Tiến độ hôm nay: <span className="text-sky-900 font-semibold">{done}/{total}</span>
        </span>
        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center gap-1 text-glow-600 font-medium bg-glow-50 rounded-full px-3 py-1.5 active:scale-95 transition-transform"
        >
          <PlusIcon /> Thêm nhiệm vụ
        </button>
      </div>

      <div className="mt-2">
        {PERIOD_ORDER.map((period) => {
          const tasks = grouped.get(period) ?? []
          if (tasks.length === 0) return null
          return (
            <section key={period} className="mt-5 px-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-sky-700">{PERIOD_LABELS[period]}</h2>
                {period !== 'flexible' && <PeriodCountdown period={period} />}
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onOpenPomodoro={period === 'flexible' ? () => setShowPomodoro(true) : undefined} />
                ))}
              </div>
            </section>
          )
        })}
        {total === 0 && (
          <div className="px-5 mt-10 text-center text-sky-400 text-sm">Đang tải nhiệm vụ hôm nay…</div>
        )}
      </div>

      {showAddTask && <AddTaskModal onClose={() => setShowAddTask(false)} />}
      {showPomodoro && <PomodoroModal onClose={() => setShowPomodoro(false)} />}
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}
