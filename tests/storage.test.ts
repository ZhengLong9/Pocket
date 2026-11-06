import { describe, expect, it } from 'vitest'
import { loadWorkspace, saveWorkspace } from '../src/lib/storage'
import { demoState, emptyState } from '../src/lib/seed'

describe('browser storage', () => {
  it('isolates demo records from personal records', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value)
      },
    }
    saveWorkspace(storage, 'demo', demoState('2026-11-06'))
    saveWorkspace(storage, 'personal', emptyState())
    expect(loadWorkspace(storage, 'demo', '2026-11-06').data.expenses.length).toBeGreaterThan(0)
    expect(loadWorkspace(storage, 'personal', '2026-11-06').data.expenses).toEqual([])
  })
  it('does not overwrite incompatible or corrupt saved records while loading', () => {
    const original = '{"version":999,"expenses":"bad"}'
    const storage = { getItem: () => original }
    expect(loadWorkspace(storage, 'personal', '2026-11-06').error).toMatch(
      /original copy has been kept/,
    )
    expect(storage.getItem()).toBe(original)
  })
  it('reports storage failures instead of claiming a save succeeded', () => {
    expect(
      saveWorkspace(
        {
          setItem() {
            throw new Error('QuotaExceededError')
          },
        },
        'personal',
        emptyState(),
      ),
    ).toMatch(/could not be saved/)
  })
})
