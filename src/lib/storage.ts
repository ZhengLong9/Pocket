import { financeStateSchema } from './model'
import type { FinanceState, WorkspaceMode } from './model'
import { demoState, emptyState } from './seed'

const key = (mode: WorkspaceMode) => `pocket:${mode}:v1`
export type StorageResult = { data: FinanceState; error: string | null }

export function loadWorkspace(
  storage: Pick<Storage, 'getItem'>,
  mode: WorkspaceMode,
  today: string,
): StorageResult {
  const fallback = () => (mode === 'demo' ? demoState(today) : emptyState())
  try {
    const raw = storage.getItem(key(mode))
    if (!raw) return { data: fallback(), error: null }
    const parsed = financeStateSchema.safeParse(JSON.parse(raw))
    if (!parsed.success)
      return {
        data: fallback(),
        error:
          'Saved data could not be read. The original copy has been kept; export or recover it before saving changes.',
      }
    return { data: parsed.data, error: null }
  } catch {
    return {
      data: fallback(),
      error: 'Browser storage is unavailable. Changes will only last for this session.',
    }
  }
}

export function saveWorkspace(
  storage: Pick<Storage, 'setItem'>,
  mode: WorkspaceMode,
  data: FinanceState,
): string | null {
  try {
    storage.setItem(key(mode), JSON.stringify(data))
    return null
  } catch {
    return 'Changes could not be saved in this browser. Export a backup before closing the app.'
  }
}
