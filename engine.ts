import { db } from './db'
import { DEFAULT_TEMPLATES } from './defaultTemplates'
import { todayStr, isPeriodLocked, addDaysToDateStr } from './dateUtils'
import { creditsForStreak, milestoneForStreak } from './types'
import type { TaskTemplate, TaskInstance, StreakState, DayRecord } from './types'

function uid(): string {
  return crypto.randomUUID()
}

/**
 * Chạy 1 lần khi app khởi động lần đầu: tạo sẵn khung nhiệm vụ chuẩn.
 * Bọc trong 1 transaction để tránh race condition khi hàm này được gọi đồng thời
 * nhiều lần (VD: React StrictMode gọi effect 2 lần khi phát triển) — nếu không sẽ
 * bị tạo trùng lặp toàn bộ khung nhiệm vụ mặc định.
 */
export async function ensureSeeded(): Promise<void> {
  await db.transaction('rw', db.templates, db.streak, async () => {
    const count = await db.templates.count()
    if (count > 0) return
    const now = Date.now()
    const today = todayStr()
    const templates: TaskTemplate[] = DEFAULT_TEMPLATES.map((t) => ({
      id: uid(),
      title: t.title,
      period: t.period,
      isDefault: true,
      effectiveFrom: today,
      archived: false,
      createdAt: now,
      updatedAt: now,
    }))
    await db.templates.bulkAdd(templates)

    const streak = await db.streak.get('main')
    if (!streak) {
      const initial: StreakState = {
        id: 'main',
        currentStreak: 0,
        longestStreak: 0,
        highestMilestoneReached: 0,
        recoveryCreditsRemaining: 0,
        lastEvaluatedDate: null,
        updatedAt: now,
      }
      await db.streak.put(initial)
    }
  })
}

/**
 * Đảm bảo đã có đủ TaskInstance cho ngày `date` dựa trên các template đang hiệu lực.
 * Bọc trong transaction để tránh sinh trùng instance khi hàm bị gọi đồng thời
 * (VD: effect mount + interval bảo trì cùng lúc).
 */
export async function ensureInstancesForDate(date: string): Promise<void> {
  await db.transaction('rw', db.instances, db.templates, async () => {
    const existing = await db.instances.where('date').equals(date).toArray()
    const existingTemplateIds = new Set(existing.map((i) => i.templateId))

    const templates = await db.templates
      .filter((t) => !t.archived && t.effectiveFrom <= date)
      .toArray()

    const now = Date.now()
    const toAdd: TaskInstance[] = []
    for (const t of templates) {
      if (existingTemplateIds.has(t.id)) continue
      toAdd.push({
        id: uid(),
        templateId: t.id,
        date,
        title: t.title,
        period: t.period,
        status: 'pending',
        completedAt: null,
        updatedAt: now,
      })
    }
    if (toAdd.length > 0) {
      await db.instances.bulkAdd(toAdd)
    }
  })
}

/** Tự động khoá (đánh missed) các nhiệm vụ pending mà buổi của chúng đã qua giờ khoá, cho ngày hôm nay */
export async function autoLockOverdueTasks(date: string, now: Date = new Date()): Promise<void> {
  if (date !== todayStr(now)) return // chỉ tự khoá dựa theo đồng hồ thực khi đang xét ngày hôm nay
  const instances = await db.instances.where('date').equals(date).toArray()
  const updates: TaskInstance[] = []
  for (const inst of instances) {
    if (inst.status !== 'pending') continue
    if (inst.period === 'flexible') continue
    if (isPeriodLocked(inst.period, now)) {
      updates.push({ ...inst, status: 'missed', updatedAt: Date.now() })
    }
  }
  if (updates.length > 0) {
    await db.instances.bulkPut(updates)
  }
}

/** Đánh dấu 1 task hoàn thành/bỏ tick. Không cho tick nếu đã bị khoá (missed) trừ khi bỏ tick lại pending trong lúc còn hạn. */
export async function toggleTaskDone(instanceId: string): Promise<void> {
  const inst = await db.instances.get(instanceId)
  if (!inst) return
  if (inst.status === 'missed') return // đã khoá, không cho tick nữa
  const next = inst.status === 'done' ? 'pending' : 'done'
  await db.instances.update(instanceId, {
    status: next,
    completedAt: next === 'done' ? Date.now() : null,
    updatedAt: Date.now(),
  })
}

export interface FinalizeResult {
  allCompleted: boolean
  usedRecovery: boolean
  streakBroken: boolean
  newStreak: number
}

/**
 * "Chốt sổ" cho 1 ngày đã qua (date < hôm nay) — tính streak, dùng lượt khôi phục nếu cần.
 * Idempotent: nếu ngày đó đã có DayRecord.finalizedAt thì bỏ qua.
 */
export async function finalizeDay(date: string): Promise<FinalizeResult | null> {
  const existingRecord = await db.dayRecords.get(date)
  if (existingRecord?.finalizedAt) return null

  await ensureInstancesForDate(date)
  const instances = await db.instances.where('date').equals(date).toArray()
  const total = instances.length
  const completed = instances.filter((i) => i.status === 'done').length
  const missedIds = instances.filter((i) => i.status !== 'done').map((i) => i.id)
  // Bất kỳ nhiệm vụ nào chưa done vào lúc chốt sổ (kể cả pending còn sót, VD flexible) đều tính là chưa hoàn thành ngày đó.
  // Nếu ngày đó không có nhiệm vụ nào áp dụng (total = 0), coi như không có gì để hoàn thành nên không tính là ngày bỏ lỡ.
  const allCompleted = total === 0 || completed === total

  const streak = (await db.streak.get('main')) as StreakState
  let newStreak = streak.currentStreak
  let usedRecovery = false
  let streakBroken = false

  if (allCompleted) {
    newStreak = streak.currentStreak + 1
  } else if (streak.recoveryCreditsRemaining > 0) {
    // Dùng 1 lượt khôi phục — streak giữ nguyên, không tăng
    usedRecovery = true
    newStreak = streak.currentStreak
  } else {
    streakBroken = true
    newStreak = 0
  }

  const newLongest = Math.max(streak.longestStreak, newStreak)
  const newMilestone = Math.max(streak.highestMilestoneReached, milestoneForStreak(newStreak))
  // Số lượt khôi phục: làm mới lại đúng theo mốc cao nhất đã đạt (không cộng dồn), trừ đi lượt vừa dùng
  let newCredits = creditsForStreak(newMilestone)
  if (usedRecovery) {
    newCredits = Math.max(0, streak.recoveryCreditsRemaining - 1)
    // nếu mốc không đổi, credits giữ theo số còn lại sau khi trừ; nếu mốc tăng thì làm mới theo mốc mới
    if (newMilestone > streak.highestMilestoneReached) {
      newCredits = creditsForStreak(newMilestone)
    }
  } else if (streakBroken) {
    newCredits = 0
  }

  const updatedStreak: StreakState = {
    ...streak,
    currentStreak: newStreak,
    longestStreak: newLongest,
    highestMilestoneReached: newMilestone,
    recoveryCreditsRemaining: newCredits,
    lastEvaluatedDate: date,
    updatedAt: Date.now(),
  }
  await db.streak.put(updatedStreak)

  const record: DayRecord = {
    id: date,
    date,
    allCompleted,
    usedRecovery,
    missedTaskIds: missedIds,
    totalTasks: total,
    completedTasks: completed,
    finalizedAt: Date.now(),
  }
  await db.dayRecords.put(record)

  return { allCompleted, usedRecovery, streakBroken, newStreak }
}

/**
 * Chạy khi app mở lên: chốt sổ MỌI ngày lịch từ sau lần đánh giá gần nhất cho đến hôm qua
 * (kể cả những ngày người dùng không hề mở app — các ngày đó coi như không có nhiệm vụ nào
 * được hoàn thành, vì vậy sẽ tự sinh instance rồi tính là "bỏ lỡ" nếu khung chuẩn có hiệu lực).
 * Sau đó đảm bảo instance của hôm nay đã sẵn sàng và tự khoá các buổi đã quá giờ.
 */
export async function runDailyMaintenance(): Promise<void> {
  await ensureSeeded()
  const today = todayStr()

  const streak = (await db.streak.get('main')) as StreakState
  const lastDate = streak?.lastEvaluatedDate

  // Điểm bắt đầu duyệt: ngày sau lastEvaluatedDate, hoặc nếu chưa từng đánh giá thì bắt đầu từ
  // ngày effectiveFrom sớm nhất trong các template (thường là ngày cài app lần đầu).
  let cursor: string
  if (lastDate) {
    cursor = addDaysToDateStr(lastDate, 1)
  } else {
    const templates = await db.templates.toArray()
    const earliest = templates.reduce<string | null>((min, t) => (!min || t.effectiveFrom < min ? t.effectiveFrom : min), null)
    cursor = earliest ?? today
  }

  // Duyệt tuần tự từng ngày lịch cho tới hôm qua, tránh vòng lặp vô hạn nếu dữ liệu bất thường
  let guard = 0
  while (cursor < today && guard < 3650) {
    await finalizeDay(cursor)
    cursor = addDaysToDateStr(cursor, 1)
    guard++
  }

  await ensureInstancesForDate(today)
  await autoLockOverdueTasks(today)
}
