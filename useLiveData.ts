import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { todayStr } from '../lib/dateUtils'
import type { StreakState } from '../lib/types'

export function useTodayInstances() {
  const today = todayStr()
  return useLiveQuery(() => db.instances.where('date').equals(today).toArray(), [today], [])
}

export function useStreak(): StreakState | undefined {
  return useLiveQuery(() => db.streak.get('main'), [])
}

export function useTemplates() {
  return useLiveQuery(() => db.templates.filter((t) => !t.archived).toArray(), [], [])
}

export function useTodayNotes() {
  const today = todayStr()
  return useLiveQuery(() => db.notes.where('date').equals(today).toArray(), [today], [])
}
