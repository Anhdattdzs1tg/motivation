import { doc, collection, getDocs, setDoc, writeBatch } from 'firebase/firestore'
import { firestore } from './firebase'
import { db } from './db'
import type { TaskTemplate, TaskInstance, NoteEntry, StreakState } from './types'

/**
 * Đồng bộ 2 chiều đơn giản (last-write-wins theo `updatedAt`) giữa IndexedDB (local, offline-first)
 * và Firestore (cloud, dùng để đồng bộ nhiều thiết bị). Được gọi khi: vừa đăng nhập, có mạng trở lại,
 * hoặc định kỳ trong khi dùng app.
 */
export async function syncAll(uid: string): Promise<void> {
  if (!firestore) return
  await Promise.all([
    syncCollection<TaskTemplate>(uid, 'templates', db.templates),
    syncCollection<TaskInstance>(uid, 'instances', db.instances),
    syncCollection<NoteEntry>(uid, 'notes', db.notes),
    syncStreak(uid),
  ])
}

async function syncCollection<T extends { id: string; updatedAt: number }>(
  uid: string,
  name: string,
  table: { toArray: () => Promise<T[]>; bulkPut: (items: T[]) => Promise<unknown> },
): Promise<void> {
  if (!firestore) return
  const localItems = await table.toArray()
  const localMap = new Map(localItems.map((i) => [i.id, i]))

  const remoteSnap = await getDocs(collection(firestore, 'users', uid, name))
  const remoteMap = new Map<string, T>()
  remoteSnap.forEach((d) => remoteMap.set(d.id, d.data() as T))

  const toPullToLocal: T[] = []
  const toPushToRemote: T[] = []

  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()])
  for (const id of allIds) {
    const local = localMap.get(id)
    const remote = remoteMap.get(id)
    if (local && !remote) {
      toPushToRemote.push(local)
    } else if (!local && remote) {
      toPullToLocal.push(remote)
    } else if (local && remote) {
      if (local.updatedAt > remote.updatedAt) toPushToRemote.push(local)
      else if (remote.updatedAt > local.updatedAt) toPullToLocal.push(remote)
    }
  }

  if (toPullToLocal.length > 0) {
    await table.bulkPut(toPullToLocal)
  }
  if (toPushToRemote.length > 0) {
    const batch = writeBatch(firestore)
    for (const item of toPushToRemote) {
      batch.set(doc(firestore, 'users', uid, name, item.id), item as Record<string, unknown>)
    }
    await batch.commit()
  }
}

async function syncStreak(uid: string): Promise<void> {
  if (!firestore) return
  const local = await db.streak.get('main')
  const remoteDoc = await getDocs(collection(firestore, 'users', uid, 'streak'))
  let remote: StreakState | undefined
  remoteDoc.forEach((d) => {
    if (d.id === 'main') remote = d.data() as StreakState
  })

  if (local && !remote) {
    await setDoc(doc(firestore, 'users', uid, 'streak', 'main'), local as unknown as Record<string, unknown>)
  } else if (!local && remote) {
    await db.streak.put(remote)
  } else if (local && remote) {
    if (local.updatedAt >= remote.updatedAt) {
      await setDoc(doc(firestore, 'users', uid, 'streak', 'main'), local as unknown as Record<string, unknown>)
    } else {
      await db.streak.put(remote)
    }
  }
}
