import { Info } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { BudgetBreakdown } from '../../components/BudgetBreakdown'
import { GoalSummary } from '../../components/GoalSummary'
import { TransactionTable } from '../../components/TransactionTable'
import { monthSummary } from '../../lib/finance'
import { formatMoney, shortMoney } from '../../lib/money'
import type { Expense, FinanceState } from '../../lib/model'

type Props = {
  data: FinanceState
  month: string
  today: string
  highlightedId: string | null
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

const SpendingChart = lazy(() =>
  import('../../components/SpendingChart').then((module) => ({ default: module.SpendingChart })),
)

export function OverviewPage({ data, month, today, highlightedId, onEdit, onDelete }: Props) {
  const summary = monthSummary(data, month, today)
  const difference = summary.forecast === null ? null : summary.forecast - summary.budget.limitCents
  const highlighted = summary.expenses.find((expense) => expense.id === highlightedId)
  const recent = highlighted
    ? [highlighted, ...summary.expenses.filter((expense) => expense.id !== highlightedId)].slice(
        0,
        5,
      )
    : summary.expenses.slice(0, 5)
  return (
    <div className="overview-page page-body">
      <div className="metric-strip">
        <section className="metric">
          <div className="metric-label">Spent this month</div>
          <div className="metric-value">{formatMoney(summary.spent)}</div>
          <p className="metric-note">
            {summary.expenses.length} {summary.expenses.length === 1 ? 'expense' : 'expenses'}{' '}
            recorded
          </p>
        </section>
        <section className="metric">
          <div className="metric-label">Budget remaining</div>
          <div className={`metric-value ${summary.remaining < 0 ? 'warning' : ''}`}>
            {formatMoney(summary.remaining)}
          </div>
          <p className="metric-note">Monthly budget · {shortMoney(summary.budget.limitCents)}</p>
        </section>
        <section className="metric">
          <div className="metric-label forecast-label">
            {summary.isPast ? 'Month-end spending' : 'Projected spending'}
            <details className="forecast-help">
              <summary aria-label="How the spending forecast works">
                <Info size={13} />
              </summary>
              <div className="forecast-explanation">
                Fixed expenses recorded + unpaid scheduled bills + your daily variable spending
                average projected across the month.
                <p>
                  Based on {summary.elapsed} days.{' '}
                  {summary.elapsed < 7 && !summary.isPast
                    ? 'Early-month estimates can change significantly.'
                    : 'The estimate assumes your spending pace stays the same.'}
                </p>
              </div>
            </details>
          </div>
          <div className="metric-value">
            {summary.forecast === null ? '—' : formatMoney(summary.forecast)}
          </div>
          <p className={`metric-note ${difference !== null && difference > 0 ? 'warning' : ''}`}>
            {difference === null
              ? 'Available when the month begins'
              : difference === 0
                ? 'On budget'
                : `${shortMoney(Math.abs(difference))} ${difference > 0 ? 'over' : 'under'} budget`}
          </p>
        </section>
      </div>
      <div className="overview-columns">
        <div>
          <Suspense
            fallback={
              <div className="chart-canvas muted small" role="status">
                Loading spending chart…
              </div>
            }
          >
            <SpendingChart
              data={data}
              month={month}
              today={today}
              budget={summary.budget.limitCents}
            />
          </Suspense>
          {summary.expenses.length === 0 && (
            <p className="chart-empty-note">Add expenses to start building your spending trend.</p>
          )}
        </div>
        <aside className="overview-sidebar">
          <BudgetBreakdown data={data} month={month} today={today} />
          <GoalSummary data={data} today={today} />
        </aside>
      </div>
      <section className="recent-transactions">
        <div className="section-heading">
          <h2>Recent transactions</h2>
          <Link to="/transactions" className="text-link">
            View all
          </Link>
        </div>
        <TransactionTable
          expenses={recent}
          categories={data.categories}
          highlightedId={highlightedId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        {recent.length > 0 && (
          <div className="table-caption">
            <span>
              {highlighted
                ? 'New or updated expense shown first'
                : `Latest ${recent.length} expenses`}
            </span>
            <span>SGD</span>
          </div>
        )}
      </section>
    </div>
  )
}
