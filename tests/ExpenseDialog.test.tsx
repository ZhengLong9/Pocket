// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ExpenseDialog } from '../src/components/ExpenseDialog'
import { emptyState } from '../src/lib/seed'
import type { ExpenseInput } from '../src/lib/model'

afterEach(cleanup)
const today = '2026-11-06'
function Harness({ onSave = vi.fn() }: { onSave?: (input: ExpenseInput, id?: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open expense</button>
      <ExpenseDialog
        open={open}
        onOpenChange={setOpen}
        categories={emptyState().categories}
        bills={[]}
        expense={null}
        today={today}
        month="2026-10"
        onSave={onSave}
        returnFocus={null}
      />
    </>
  )
}

describe('expense entry flow', () => {
  it('defaults to today rather than the reporting month and explains the month switch', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open expense' }))
    expect(screen.getByLabelText('Date')).toHaveValue(today)
    expect(
      screen.getByText('Overview will switch to November 2026 after saving.'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Amount in SGD' })).toHaveFocus(),
    )
  })
  it('preserves an unsaved draft after Cancel and reopening', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open expense' }))
    await user.type(screen.getByRole('textbox', { name: 'Amount in SGD' }), '12.30')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Open expense' }))
    expect(screen.getByRole('textbox', { name: 'Amount in SGD' })).toHaveValue('12.30')
  })
  it('validates fields and saves exact cents with the chosen date and category', async () => {
    const user = userEvent.setup(),
      save = vi.fn()
    render(<Harness onSave={save} />)
    await user.click(screen.getByRole('button', { name: 'Open expense' }))
    await user.click(screen.getByRole('button', { name: 'Save expense' }))
    expect(await screen.findByText('Choose a category.')).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
    await user.type(screen.getByRole('textbox', { name: 'Amount in SGD' }), '12.30')
    await user.selectOptions(screen.getByLabelText('Category'), 'food')
    await user.click(screen.getByRole('button', { name: 'Save expense' }))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        { amountCents: 1230, description: '', categoryId: 'food', date: today },
        undefined,
      ),
    )
  })
  it('closes with Escape', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open expense' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
