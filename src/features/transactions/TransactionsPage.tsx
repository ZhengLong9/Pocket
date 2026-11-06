import { useState } from 'react'
import { Search } from 'lucide-react'
import { TransactionTable } from '../../components/TransactionTable'
import { monthExpenses } from '../../lib/finance'
import { formatMoney } from '../../lib/money'
import type { Expense, FinanceState } from '../../lib/model'

export function TransactionsPage({
  data,
  month,
  highlightedId,
  onEdit,
  onDelete,
}: {
  data: FinanceState
  month: string
  highlightedId: string | null
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}) {
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('all')
  const expenses = monthExpenses(data, month).filter(
    (expense) =>
      (category === 'all' || category === expense.categoryId) &&
      (
        expense.description ||
        data.categories.find((item) => item.id === expense.categoryId)?.name ||
        ''
      )
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  )
  return (
    <div className="page-body">
      <div className="transaction-toolbar">
        <label className="search-input">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Search transactions"
            placeholder="Search transactions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">All categories</option>
          {data.categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <span className="muted small toolbar-total">
          {expenses.length} expenses ·{' '}
          {formatMoney(expenses.reduce((sum, expense) => sum + expense.amountCents, 0))}
        </span>
      </div>
      {expenses.length ? (
        <TransactionTable
          expenses={expenses}
          categories={data.categories}
          highlightedId={highlightedId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <div className="empty-state">
          <h3>
            {search || category !== 'all' ? 'No matching expenses' : 'No expenses this month'}
          </h3>
          <p>
            {search || category !== 'all'
              ? 'Try another search or category.'
              : 'Use Add expense to record a transaction.'}
          </p>
        </div>
      )}
    </div>
  )
}
