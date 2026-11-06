import { shortMoney } from '../lib/money'
import { monthSummary } from '../lib/finance'
import type { FinanceState } from '../lib/model'

export function BudgetBreakdown({
  data,
  month,
  today,
}: {
  data: FinanceState
  month: string
  today: string
}) {
  const { categories } = monthSummary(data, month, today)
  return (
    <section>
      <h2>Budget by category</h2>
      <div className="category-list">
        {categories.map((category) => (
          <div className="category-budget" key={category.id}>
            <div className="row">
              <span>{category.name}</span>
              <span className={category.spent > category.limit ? 'warning' : 'muted'}>
                {shortMoney(category.spent)} / {shortMoney(category.limit)}
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label={`${category.name} budget used`}
              aria-valuenow={Math.min(
                100,
                category.limit ? (category.spent / category.limit) * 100 : category.spent ? 100 : 0,
              )}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${shortMoney(category.spent)} spent of ${shortMoney(category.limit)}`}
            >
              <div
                className={`progress-fill ${category.spent > category.limit ? 'over-budget' : ''}`}
                style={{
                  width: `${Math.min(100, category.limit ? (category.spent / category.limit) * 100 : category.spent ? 100 : 0)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
