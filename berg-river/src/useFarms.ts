import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  loadLocalDiary,
  loadUserFarms,
  saveLocalDiary,
  saveUserFarms,
  type Farm,
} from './farms'
import * as store from './store'
import type { DiaryEntry } from './store'

export type Notice = { text: string; error?: boolean } | null
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))

/**
 * The farm list and farm diary. Signed out: kept in this browser.
 * Signed in: kept in the account; anything added before signing in moves there.
 */
export function useFarms(session: Session | null, notify: (n: Notice) => void) {
  const signedIn = !!session
  const userId = session?.user.id
  const [farms, setFarms] = useState<Farm[]>(() =>
    loadUserFarms().map(store.withUuid)
  )
  const [diary, setDiary] = useState<DiaryEntry[]>(loadLocalDiary)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!signedIn) saveUserFarms(farms)
  }, [farms, signedIn])
  useEffect(() => {
    if (!signedIn) saveLocalDiary(diary)
  }, [diary, signedIn])

  useEffect(() => {
    if (!userId) {
      setFarms(loadUserFarms().map(store.withUuid))
      setDiary(loadLocalDiary())
      return
    }
    let live = true
    setLoading(true)
    ;(async () => {
      try {
        const local = loadUserFarms().map(store.withUuid)
        const localDiary = loadLocalDiary()
        if (local.length) {
          await store.insertFarms(local)
          saveUserFarms([])
        }
        if (localDiary.length) {
          await store.insertDiary(localDiary)
          saveLocalDiary([])
        }
        if (live && local.length)
          notify({
            text: `Saved ${local.length} farm${local.length === 1 ? '' : 's'} from this browser to your account.`,
          })
        const [remote, remoteDiary] = await Promise.all([
          store.fetchFarms(),
          store.fetchDiary().catch(() => []),
        ])
        if (live) {
          setFarms(remote)
          setDiary(remoteDiary)
        }
      } catch (e) {
        if (live)
          notify({
            text: `Couldn't load your saved farms: ${msg(e)}`,
            error: true,
          })
      } finally {
        if (live) setLoading(false)
      }
    })()
    return () => {
      live = false
    }
  }, [userId, notify])

  const addFarms = useCallback(
    (added: Farm[]) => {
      if (!added.length) return
      setFarms((fs) => [...added, ...fs])
      if (signedIn)
        store.insertFarms(added).catch((e: unknown) => {
          const ids = new Set(added.map((f) => f.id))
          setFarms((fs) => fs.filter((f) => !ids.has(f.id)))
          notify({
            text: `Couldn't save to your account: ${msg(e)}`,
            error: true,
          })
        })
    },
    [signedIn, notify]
  )

  const removeFarm = useCallback(
    (farm: Farm) => {
      setFarms((fs) => fs.filter((f) => f.id !== farm.id))
      setDiary((d) => d.filter((e) => e.farmId !== farm.id))
      if (signedIn)
        store.deleteFarm(farm.id).catch((e: unknown) => {
          setFarms((fs) =>
            fs.some((f) => f.id === farm.id) ? fs : [farm, ...fs]
          )
          notify({
            text: `Couldn't remove ${farm.name} from your account: ${msg(e)}`,
            error: true,
          })
        })
    },
    [signedIn, notify]
  )

  const renameFarm = useCallback(
    (farm: Farm, name: string) => {
      const clean = name.trim().slice(0, 200)
      if (!clean || clean === farm.name) return
      setFarms((fs) =>
        fs.map((f) => (f.id === farm.id ? { ...f, name: clean } : f))
      )
      if (signedIn)
        store.renameFarm(farm.id, clean).catch((e: unknown) => {
          setFarms((fs) =>
            fs.map((f) => (f.id === farm.id ? { ...f, name: farm.name } : f))
          )
          notify({
            text: `Couldn't rename ${farm.name}: ${msg(e)}`,
            error: true,
          })
        })
    },
    [signedIn, notify]
  )

  const addDiary = useCallback(
    (farmId: string, day: string, note: string) => {
      const entry: DiaryEntry = {
        id: store.newId(),
        farmId,
        day,
        note: note.trim().slice(0, 500),
      }
      if (!entry.note) return
      setDiary((d) => [...d, entry].sort((a, b) => a.day.localeCompare(b.day)))
      if (signedIn)
        store.insertDiary([entry]).catch((e: unknown) => {
          setDiary((d) => d.filter((x) => x.id !== entry.id))
          notify({
            text: `Couldn't save the diary note: ${msg(e)}`,
            error: true,
          })
        })
    },
    [signedIn, notify]
  )

  const removeDiary = useCallback(
    (entry: DiaryEntry) => {
      setDiary((d) => d.filter((x) => x.id !== entry.id))
      if (signedIn)
        store.deleteDiary(entry.id).catch((e: unknown) => {
          setDiary((d) =>
            [...d, entry].sort((a, b) => a.day.localeCompare(b.day))
          )
          notify({
            text: `Couldn't delete the diary note: ${msg(e)}`,
            error: true,
          })
        })
    },
    [signedIn, notify]
  )

  return {
    farms,
    diary,
    loading,
    addFarms,
    removeFarm,
    renameFarm,
    addDiary,
    removeDiary,
  }
}
