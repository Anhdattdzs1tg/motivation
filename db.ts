import Dexie, { type EntityTable } from 'dexie'
import type { TaskTemplate, TaskInstance, NoteEntry, StreakState, DayRecord } from './types'

class HabitDB extends Dexie {
  templates!: EntityTable<TaskTemplate, 'id'>
  instances!: EntityTable<TaskInstance, 'id'>
  notes!: EntityTable<NoteEntry, 'id'>
  streak!: EntityTable<StreakState, 'id'>
  dayRecords!: EntityTable<DayRecord, 'id'>

  constructor() {
    super('habit-tracker-db')
    this.version(1).stores({
      templates: 'id, period, archived, effectiveFrom',
      instances: 'id, date, templateId, status, period',
      notes: 'id, date, createdAt',
      streak: 'id',
      dayRecords: 'id, date',
    })
  }
}

export const db = new HabitDB()
