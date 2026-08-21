import { useEffect, useRef, useState } from 'react'
import { playAlertSound } from '../lib/pomodoroSound'

type Phase = 'study' | 'break'
type RunState = 'idle' | 'running' | 'paused'

const STUDY_SECONDS = 45 * 60
const BREAK_SECONDS = 10 * 60

export default function PomodoroModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('study')
  const [runState, setRunState] = useState<RunState>('idle')
  const [secondsLeft, setSecondsLeft] = useState(STUDY_SECONDS)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (runState !== 'running') return
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          playAlertSound()
          const nextPhase: Phase = phase === 'study' ? 'break' : 'study'
          setPhase(nextPhase)
          return nextPhase === 'study' ? STUDY_SECONDS : BREAK_SECONDS
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [runState, phase])

  const start = () => setRunState('running')
  const pause = () => setRunState('paused')
  const stop = () => {
    setRunState('idle')
    setPhase('study')
    setSecondsLeft(STUDY_SECONDS)
  }

  const totalSeconds = phase === 'study' ? STUDY_SECONDS : BREAK_SECONDS
  const progress = 1 - secondsLeft / totalSeconds
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  const radius = 88
  const circumference = 2 * Math.PI * radius

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-900/50 backdrop-blur-sm px-5" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-sky-900">Pomodoro học bài</h2>
          <button onClick={onClose} className="text-sky-400 p-1" aria-label="Đóng">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-sky-500 mb-6">Học 45 phút, nghỉ 10 phút. Có âm báo khi chuyển phiên.</p>

        <div className="relative w-56 h-56 mx-auto mb-6">
          <svg width="224" height="224" viewBox="0 0 224 224" className="-rotate-90">
            <circle cx="112" cy="112" r={radius} fill="none" stroke="#e6f0fb" strokeWidth="14" />
            <circle
              cx="112"
              cy="112"
              r={radius}
              fill="none"
              stroke={phase === 'study' ? '#5a87cc' : '#f96f1f'}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-xs font-semibold uppercase tracking-wide mb-1 px-2.5 py-0.5 rounded-full ${
                phase === 'study' ? 'text-sky-600 bg-sky-100' : 'text-glow-600 bg-glow-100'
              }`}
            >
              {phase === 'study' ? 'Đang học' : 'Đang nghỉ'}
            </span>
            <span className="text-4xl font-bold tabular-nums text-sky-900">
              {mm}:{ss}
            </span>
            {runState === 'running' && phase === 'study' && (
              <span className="mt-2 w-2 h-2 rounded-full bg-glow-500 animate-pulse-ring" />
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {runState !== 'running' ? (
            <button
              onClick={start}
              className="flex-1 rounded-xl py-3.5 text-sm font-semibold text-white bg-sky-500 active:scale-[0.98] transition-transform"
            >
              {runState === 'paused' ? 'Tiếp tục' : 'Bắt đầu học'}
            </button>
          ) : (
            <button
              onClick={pause}
              className="flex-1 rounded-xl py-3.5 text-sm font-semibold text-sky-700 bg-sky-100 active:scale-[0.98] transition-transform"
            >
              Tạm dừng
            </button>
          )}
          <button
            onClick={stop}
            disabled={runState === 'idle'}
            className="flex-1 rounded-xl py-3.5 text-sm font-semibold text-danger-600 bg-danger-500/10 disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            Dừng
          </button>
        </div>
        <p className="text-xs text-sky-400 text-center mt-4">
          Không học nữa? Bấm <span className="font-medium">Dừng</span> để tắt hẳn — sẽ không có thông báo nào nữa.
        </p>
      </div>
    </div>
  )
}
