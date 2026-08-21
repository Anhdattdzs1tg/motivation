import { useState } from 'react'
import type { TaskInstance } from '../lib/types'
import { toggleTaskDone } from '../lib/engine'

export default function TaskRow({ task, onOpenPomodoro }: { task: TaskInstance; onOpenPomodoro?: () => void }) {
  const [popping, setPopping] = useState(false)
  const isFlexibleStudy = task.period === 'flexible'

  const handleToggle = async () => {
    if (task.status === 'missed') return
    setPopping(true)
    await toggleTaskDone(task.id)
    setTimeout(() => setPopping(false), 300)
  }

  const isDone = task.status === 'done'
  const isMissed = task.status === 'missed'

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-3 border transition-colors ${
        isMissed
          ? 'bg-sky-50/60 border-sky-100 opacity-60'
          : isDone
            ? 'bg-success-500/10 border-success-500/30'
            : 'bg-white border-sky-100'
      }`}
    >
      <button
        onClick={handleToggle}
        disabled={isMissed}
        aria-label={isDone ? 'Bỏ tick nhiệm vụ' : 'Đánh dấu hoàn thành'}
        className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
          isDone
            ? 'bg-success-500 border-success-500 text-white'
            : isMissed
              ? 'border-sky-200 text-transparent cursor-not-allowed'
              : 'border-sky-300 text-transparent active:scale-90'
        } ${popping ? 'animate-pop' : ''}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 12.5 10 17l9-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <span className={`flex-1 text-[15px] ${isDone ? 'line-through text-sky-400' : isMissed ? 'text-sky-400' : 'text-sky-900'}`}>
        {task.title}
      </span>

      {isMissed && <span className="text-xs font-medium text-danger-600 shrink-0">Đã bỏ lỡ</span>}

      {isFlexibleStudy && !isMissed && onOpenPomodoro && (
        <button
          onClick={onOpenPomodoro}
          className="shrink-0 text-xs font-medium text-glow-600 bg-glow-100 rounded-full px-2.5 py-1 active:scale-95 transition-transform"
        >
          Pomodoro
        </button>
      )}
    </div>
  )
}
