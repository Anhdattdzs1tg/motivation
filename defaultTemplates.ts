import type { Period } from './types'

export interface DefaultTemplateSeed {
  title: string
  period: Period
}

/** Khung nhiệm vụ chuẩn đã thống nhất với người dùng */
export const DEFAULT_TEMPLATES: DefaultTemplateSeed[] = [
  { title: 'Vệ sinh cá nhân', period: 'morning' },
  { title: 'Uống nước', period: 'morning' },
  { title: 'Ngủ trưa', period: 'afternoon' },
  { title: 'Uống nước', period: 'afternoon' },
  { title: 'Tắm', period: 'evening' },
  { title: 'Uống nước', period: 'evening' },
  { title: 'Skincare', period: 'evening' },
  { title: 'Học bài', period: 'flexible' },
]
