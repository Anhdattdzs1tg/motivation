import { addDays as addCalendarDays, differenceInCalendarDays, parseISO } from 'date-fns'
import type { Period } from './types'
import { PERIOD_END_HOUR, PERIOD_START_HOUR } from './types'

// Toàn bộ app hoạt động theo giờ Việt Nam (Asia/Bangkok, UTC+7) một cách tường minh,
// không phụ thuộc vào múi giờ hệ thống của thiết bị — tránh trường hợp thiết bị bị
// cài sai múi giờ làm khoá nhầm buổi hoặc lệch ngày.
const APP_TIMEZONE = 'Asia/Bangkok'

interface BangkokParts {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
  second: number
}

function getBangkokParts(d: Date): BangkokParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const map: Record<string, string> = {}
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value
  }
  // Intl có thể trả "24" cho giờ nửa đêm tuỳ engine — chuẩn hoá về 0
  const hour = Number(map.hour) % 24
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Ngày hiện tại (yyyy-MM-dd) theo giờ Việt Nam */
export function todayStr(d: Date = new Date()): string {
  const p = getBangkokParts(d)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

export function tomorrowStr(d: Date = new Date()): string {
  return addDaysToDateStr(todayStr(d), 1)
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const base = parseISO(dateStr)
  const next = addCalendarDays(base, days)
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
}

export function dateFromStr(s: string): Date {
  return parseISO(s)
}

export function daysBetween(a: string, b: string): number {
  return differenceInCalendarDays(parseISO(b), parseISO(a))
}

/** Giờ hiện tại trong ngày (0-24, có phần thập phân cho phút) theo giờ Việt Nam */
function currentHourDecimal(now: Date = new Date()): number {
  const p = getBangkokParts(now)
  return p.hour + p.minute / 60 + p.second / 3600
}

/** Trả về buổi hiện tại dựa theo giờ trong ngày, theo khung 0-13 / 13-18 / 18-24 (giờ VN) */
export function currentPeriod(now: Date = new Date()): Exclude<Period, 'flexible'> {
  const h = currentHourDecimal(now)
  if (h < PERIOD_END_HOUR.morning) return 'morning'
  if (h < PERIOD_END_HOUR.afternoon) return 'afternoon'
  return 'evening'
}

/** Số phút còn lại đến khi buổi `period` bị khoá, theo giờ Việt Nam */
export function minutesUntilPeriodEnd(period: Exclude<Period, 'flexible'>, now: Date = new Date()): number {
  const endHour = PERIOD_END_HOUR[period]
  const h = currentHourDecimal(now)
  let diffHours = endHour - h
  if (diffHours < 0) diffHours = 0
  return Math.floor(diffHours * 60)
}

/**
 * Buổi bị khoá khi giờ hiện tại (giờ VN) đã vượt qua giờ kết thúc của buổi đó.
 * Buổi "tối" kết thúc lúc 24:00 = nửa đêm, tức là khi ngày đã chuyển sang hôm sau —
 * việc chuyển ngày (đổi `date` của TaskInstance) tự nhiên xử lý việc khoá này,
 * nên trong ngày hiện tại buổi tối không bao giờ tự khoá.
 */
export function isPeriodLocked(period: Exclude<Period, 'flexible'>, now: Date = new Date()): boolean {
  if (period === 'evening') return false
  const h = currentHourDecimal(now)
  return h >= PERIOD_END_HOUR[period]
}

export function periodBounds(period: Exclude<Period, 'flexible'>): { start: number; end: number } {
  return { start: PERIOD_START_HOUR[period], end: PERIOD_END_HOUR[period] }
}

export function formatVietnameseDate(dateStr: string): string {
  const d = parseISO(dateStr)
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return `${days[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function formatClock(now: Date = new Date()): string {
  const p = getBangkokParts(now)
  return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`
}
