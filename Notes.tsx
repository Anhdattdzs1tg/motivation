import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { formatVietnameseDate, todayStr } from '../lib/dateUtils'
import { format } from 'date-fns'

export default function Notes() {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const notes = useLiveQuery(() => db.notes.orderBy('createdAt').reverse().toArray(), [], [])

  const addNote = async () => {
    const content = draft.trim()
    if (!content) return
    const now = Date.now()
    await db.notes.add({
      id: crypto.randomUUID(),
      date: todayStr(),
      content,
      createdAt: now,
      updatedAt: now,
    })
    setDraft('')
  }

  const startEdit = (id: string, content: string) => {
    setEditingId(id)
    setEditDraft(content)
  }

  const saveEdit = async (id: string) => {
    const content = editDraft.trim()
    if (!content) {
      setEditingId(null)
      return
    }
    await db.notes.update(id, { content, updatedAt: Date.now() })
    setEditingId(null)
  }

  const deleteNote = async (id: string) => {
    await db.notes.delete(id)
  }

  return (
    <div className="pb-4">
      <header className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-sky-900">Nhật ký hôm nay</h1>
        <p className="text-sm text-sky-500 mt-0.5">Ghi chú tự do — không tick, không ảnh hưởng chuỗi.</p>
      </header>

      <div className="mx-5 mt-4 bg-white rounded-2xl border border-sky-100 p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Hôm nay có gì đáng nhớ…"
          rows={3}
          className="w-full resize-none text-[15px] text-sky-900 placeholder:text-sky-300 focus:outline-none"
        />
        <div className="flex justify-end mt-1">
          <button
            onClick={addNote}
            disabled={!draft.trim()}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-white bg-glow-500 disabled:opacity-40 active:scale-95 transition-transform"
          >
            Lưu ghi chú
          </button>
        </div>
      </div>

      <div className="mx-5 mt-5 space-y-3">
        {notes.length === 0 && <p className="text-center text-sky-400 text-sm mt-8">Chưa có ghi chú nào.</p>}
        {notes.map((note) => (
          <div key={note.id} className="bg-white rounded-xl border border-sky-100 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-sky-400">
                {formatVietnameseDate(note.date)} · {format(note.createdAt, 'HH:mm')}
              </span>
              <div className="flex gap-2">
                <button onClick={() => startEdit(note.id, note.content)} className="text-sky-400 p-1" aria-label="Sửa">
                  <PencilIcon />
                </button>
                <button onClick={() => deleteNote(note.id)} className="text-danger-600 p-1" aria-label="Xoá">
                  <TrashIcon />
                </button>
              </div>
            </div>
            {editingId === note.id ? (
              <div>
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  rows={2}
                  className="w-full resize-none text-[15px] text-sky-900 border border-sky-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  autoFocus
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="text-xs text-sky-500 px-3 py-1.5">
                    Huỷ
                  </button>
                  <button onClick={() => saveEdit(note.id)} className="text-xs font-semibold text-white bg-sky-500 rounded-full px-3 py-1.5">
                    Lưu
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[15px] text-sky-800 whitespace-pre-wrap">{note.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
