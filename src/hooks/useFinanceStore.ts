import { useEffect, useState } from 'react'
import { loadWorkspace, saveWorkspace } from '../lib/storage'
import { demoState, emptyState } from '../lib/seed'
import type { FinanceState, WorkspaceMode } from '../lib/model'

export function useFinanceStore(mode: WorkspaceMode, today: string) {
  const [initial] = useState(() => {
    try {
      return loadWorkspace(window.localStorage, mode, today)
    } catch {
      return {
        data: mode === 'demo' ? demoState(today) : emptyState(),
        error: 'Browser storage is unavailable. Changes will only last for this session.',
      }
    }
  })
  const [data, setData] = useState(initial.data)
  const [dirty, setDirty] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(initial.error)
  useEffect(() => {
    if (!dirty || initial.error) return
    try {
      setStorageError(saveWorkspace(window.localStorage, mode, data))
    } catch {
      setStorageError('Changes could not be saved. Export a backup before closing the app.')
    }
  }, [data, dirty, mode, initial.error])
  function update(change: (current: FinanceState) => FinanceState) {
    setData(change)
    setDirty(true)
  }
  return { data, update, storageError }
}
