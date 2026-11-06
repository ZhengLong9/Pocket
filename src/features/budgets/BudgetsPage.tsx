import { useState } from 'react'
import { Plus } from 'lucide-react'
import { monthBudget, monthSummary } from '../../lib/finance'
import { formatMoney, moneyInput, parseMoney } from '../../lib/money'
import { dateLabel, monthLabel } from '../../lib/dates'
import type { FinanceState } from '../../lib/model'

type Props = {
  data: FinanceState
  month: string
  today: string
  update: (change: (current: FinanceState) => FinanceState) => void
  notify: (message: string) => void
}

export function BudgetsPage({ data, month, today, update, notify }: Props) {
  const budget = monthBudget(data, month)
  const [limit, setLimit] = useState(moneyInput(budget.limitCents))
  const [limits, setLimits] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      data.categories.map((category) => [
        category.id,
        moneyInput(budget.categoryLimits[category.id] ?? 0),
      ]),
    ),
  )
  const [categoryName, setCategoryName] = useState(''),
    [categoryKind, setCategoryKind] = useState<'variable' | 'fixed'>('variable')
  const [error, setError] = useState(''),
    [adding, setAdding] = useState(false)
  const summary = monthSummary(data, month, today)
  const allocated = Object.values(limits).reduce((sum, value) => sum + (parseMoney(value) ?? 0), 0)
  return (
    <div className="page-body settings-page">
      <section>
        <div className="section-heading">
          <h2>Monthly budget</h2>
          <span className="small muted">{monthLabel(month)}</span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const total = parseMoney(limit)
            const entries = data.categories.map(
              (category) => [category.id, parseMoney(limits[category.id] ?? '0')] as const,
            )
            if (total === null || entries.some(([, amount]) => amount === null)) {
              setError('Enter amounts with up to two decimal places.')
              return
            }
            update((current) => ({
              ...current,
              budgets: {
                ...current.budgets,
                [month]: {
                  limitCents: total,
                  categoryLimits: Object.fromEntries(entries) as Record<string, number>,
                },
              },
            }))
            setError('')
            notify(`Budget saved for ${monthLabel(month)}.`)
          }}
        >
          <label className="field budget-total-field">
            Overall limit (SGD)
            <input
              inputMode="decimal"
              required
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
          </label>
          <div className="section-heading category-heading">
            <h2>Categories</h2>
            <button type="button" className="button" onClick={() => setAdding(!adding)}>
              <Plus size={14} />
              Add category
            </button>
          </div>
          <div className="budget-editor">
            <div className="budget-editor-head">
              <span>Category</span>
              <span>Type</span>
              <span>Spent</span>
              <span>Limit (SGD)</span>
            </div>
            {data.categories.map((category) => (
              <div className="budget-editor-row" key={category.id}>
                <span>{category.name}</span>
                <span className="muted small">
                  {category.kind === 'fixed' ? 'Fixed' : 'Variable'}
                </span>
                <span className="numeric">
                  {formatMoney(
                    summary.categories.find((item) => item.id === category.id)?.spent ?? 0,
                  )}
                </span>
                <input
                  aria-label={`${category.name} budget in SGD`}
                  inputMode="decimal"
                  value={limits[category.id] ?? '0.00'}
                  onChange={(event) => setLimits({ ...limits, [category.id]: event.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="row allocation-summary">
            <span className="muted small">
              Category limits total {formatMoney(allocated)}
              {allocated > (parseMoney(limit) ?? 0) ? ' · above overall limit' : ''}
            </span>
            <button className="button primary" type="submit">
              Save budget
            </button>
          </div>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </form>
        {adding && (
          <form
            className="inline-category-form"
            onSubmit={(event) => {
              event.preventDefault()
              const name = categoryName.trim()
              if (
                !name ||
                data.categories.some(
                  (category) => category.name.toLowerCase() === name.toLowerCase(),
                )
              ) {
                setError('Choose a unique category name.')
                return
              }
              const id = crypto.randomUUID()
              update((current) => ({
                ...current,
                categories: [...current.categories, { id, name, kind: categoryKind }],
              }))
              setLimits({ ...limits, [id]: '0.00' })
              setCategoryName('')
              setAdding(false)
              setError('')
              notify('Category added.')
            }}
          >
            <label className="field">
              Category name
              <input
                required
                maxLength={40}
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
              />
            </label>
            <label className="field">
              Spending type
              <select
                value={categoryKind}
                onChange={(event) => setCategoryKind(event.target.value as 'variable' | 'fixed')}
              >
                <option value="variable">Variable</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>
            <button className="button" type="button" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="button primary" type="submit">
              Add category
            </button>
          </form>
        )}
      </section>
      {data.bills.length > 0 && (
        <section className="scheduled-bills">
          <h2>Scheduled bills</h2>
          <p className="muted small">
            Link an expense to a scheduled bill when recording its payment.
          </p>
          {data.bills.map((bill) => {
            const pending = summary.pendingBills.find((item) => item.id === bill.id)
            return (
              <div className="scheduled-bill-row" key={bill.id}>
                <span>{bill.name}</span>
                <span className="muted">{pending ? dateLabel(pending.dueDate) : 'Recorded'}</span>
                <span className="numeric">{formatMoney(bill.amountCents)}</span>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
