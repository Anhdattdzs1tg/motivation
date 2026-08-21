import { useState } from 'react'
import { db } from '../lib/db'
import { tomorrowStr } from '../lib/dateUtils'
import type { Period } from '../lib/types'
import { PERIOD_LABELS } from '../lib/types'

const PERIOD_OPTIONS: Period[] = ['morning', 'afternoon', 'evening', 'flexible']

export default function AddTaskModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [period, setPeriod] = useState<Period>('morning')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setSaving(true)
    const now = Date.now()
    await db.templates.add({
      id: crypto.randomUUID(),
      title: trimmed,
      period,
      isDefault: false,
      effectiveFrom: tomorrowStr(),
      archived: false,
      createdAt: now,
      updatedAt: now,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-sky-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-8 animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-sky-200 rounded-full mx-auto mb-4 sm:hidden" />
        <h2 className="text-lg font-semibold text-sky-900 mb-1">Thêm nhiệm vụ mới</h2>
        <p className="text-sm text-sky-500 mb-4">Nhiệm vụ mới sẽ áp dụng từ ngày mai.</p>

        <label className="block text-sm font-medium text-sky-700 mb-1.5">Tên nhiệm vụ</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Đi bộ 30 phút"
          className="w-full rounded-xl border border-sky-200 px-3.5 py-2.5 text-[15px] text-sky-900 placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400 mb-4"
          autoFocus
        />

        <label className="block text-sm font-medium text-sky-700 mb-1.5">Thuộc buổi</label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium border transition-colors ${
                period === p ? 'bg-sky-500 border-sky-500 text-white' : 'bg-sky-50 border-sky-100 text-sky-600'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-3 text-sm font-medium text-sky-600 bg-sky-50 active:scale-[0.98] transition-transform"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || saving}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-white bg-glow-500 disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  )
}
