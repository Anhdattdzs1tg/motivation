// ===== Các kiểu dữ liệu dùng chung trong toàn app =====

export type Period = 'morning' | 'afternoon' | 'evening' | 'flexible'
// morning   = Sáng   (00:00 - 13:00)
// afternoon = Chiều  (13:00 - 18:00)
// evening   = Tối    (18:00 - 24:00)
// flexible  = Linh hoạt cả ngày (VD: Học bài)

export type TaskStatus = 'pending' | 'done' | 'missed'

/** Định nghĩa 1 loại nhiệm vụ trong "khung chuẩn" — không gắn với ngày cụ thể */
export interface TaskTemplate {
  id: string
  title: string
  period: Period
  /** true = nhiệm vụ mặc định có sẵn từ đầu, false = do người dùng tự thêm */
  isDefault: boolean
  /** Ngày (yyyy-MM-dd) mà template này bắt đầu có hiệu lực. Nhiệm vụ thêm hôm nay sẽ có effectiveFrom = ngày mai */
  effectiveFrom: string
  /** true nếu đã bị người dùng xoá khỏi khung chuẩn (không sinh instance nữa) */
  archived: boolean
  createdAt: number
  updatedAt: number
}

/** 1 nhiệm vụ cụ thể của 1 ngày cụ thể (sinh ra từ TaskTemplate mỗi ngày) */
export interface TaskInstance {
  id: string
  templateId: string
  date: string // yyyy-MM-dd
  title: string
  period: Period
  status: TaskStatus
  completedAt: number | null
  updatedAt: number
}

/** Note tự do trong ngày - không tick, không ảnh hưởng streak */
export interface NoteEntry {
  id: string
  date: string // yyyy-MM-dd
  content: string
  createdAt: number
  updatedAt: number
}

/** Trạng thái streak tổng thể */
export interface StreakState {
  id: 'main' // chỉ có 1 record duy nhất
  currentStreak: number
  longestStreak: number
  /** Mốc streak cao nhất từng đạt được (0, 10, 30, 100, 200) - dùng để tính số lượt khôi phục */
  highestMilestoneReached: number
  recoveryCreditsRemaining: number
  lastEvaluatedDate: string | null // ngày cuối cùng đã được tính toán (yyyy-MM-dd)
  updatedAt: number
}

/** Lịch sử theo từng ngày - dùng cho trang Lịch sử & Thống kê */
export interface DayRecord {
  id: string // = date, yyyy-MM-dd
  date: string
  allCompleted: boolean
  usedRecovery: boolean
  missedTaskIds: string[]
  totalTasks: number
  completedTasks: number
  finalizedAt: number | null // null nếu ngày chưa kết thúc (chưa qua 24h)
}

export const STREAK_MILESTONES: { threshold: number; credits: number }[] = [
  { threshold: 200, credits: 6 },
  { threshold: 100, credits: 5 },
  { threshold: 30, credits: 3 },
  { threshold: 10, credits: 2 },
  { threshold: 0, credits: 0 },
]

export function creditsForStreak(streak: number): number {
  for (const m of STREAK_MILESTONES) {
    if (streak >= m.threshold) return m.credits
  }
  return 0
}

export function milestoneForStreak(streak: number): number {
  for (const m of STREAK_MILESTONES) {
    if (streak >= m.threshold) return m.threshold
  }
  return 0
}

export const PERIOD_LABELS: Record<Period, string> = {
  morning: 'Buổi sáng',
  afternoon: 'Buổi chiều',
  evening: 'Buổi tối',
  flexible: 'Linh hoạt cả ngày',
}

/** Giờ khoá (giờ kết thúc, theo giờ trong ngày 0-24) cho từng buổi. flexible không bị khoá theo buổi. */
export const PERIOD_END_HOUR: Record<Exclude<Period, 'flexible'>, number> = {
  morning: 13,
  afternoon: 18,
  evening: 24,
}
export const PERIOD_START_HOUR: Record<Exclude<Period, 'flexible'>, number> = {
  morning: 0,
  afternoon: 13,
  evening: 18,
}
