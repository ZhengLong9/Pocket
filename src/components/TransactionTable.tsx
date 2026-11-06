import { Pencil, Trash2 } from 'lucide-react'
import { dateLabel } from '../lib/dates'
import { formatMoney } from '../lib/money'
import type { Category, Expense } from '../lib/model'

type Props = {
  expenses: Expense[]
  categories: Category[]
  highlightedId?: string | null
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function TransactionTable({ expenses, categories, highlightedId, onEdit, onDelete }: Props) {
  if (!expenses.length)
    return (
      <div className="empty-state">
        <h3>No expenses yet</h3>
        <p>Add your first expense to see it here.</p>
      </div>
    )
  return (
    <div className="table-scroll">
      <table className="transaction-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Category</th>
            <th scope="col" className="numeric">
              Amount
            </th>
            <th scope="col" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => {
            const category =
              categories.find((item) => item.id === expense.categoryId)?.name ?? 'Uncategorised'
            const description = expense.description || category
            return (
              <tr key={expense.id} className={expense.id === highlightedId ? 'recently-added' : ''}>
                <td className="date-cell">{dateLabel(expense.date)}</td>
                <td className="description-cell">{description}</td>
                <td className="category-cell">{category}</td>
                <td className="numeric amount-cell">{formatMoney(expense.amountCents)}</td>
                <td className="actions-cell">
                  <button
                    className="icon-button"
                    aria-label={`Edit ${description}`}
                    onClick={() => onEdit(expense)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-button delete-action"
                    aria-label={`Delete ${description}`}
                    onClick={() => onDelete(expense)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
