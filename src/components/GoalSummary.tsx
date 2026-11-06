import { Link } from 'react-router-dom'
import { goalSummary } from '../lib/finance'
import { shortMoney } from '../lib/money'
import type { FinanceState } from '../lib/model'

export function GoalSummary({ data, today }: { data: FinanceState; today: string }) {
  const goal = data.goals[0]
  if (!goal)
    return (
      <section className="goal-preview">
        <h2>Savings goals</h2>
        <p className="muted">Set a target and track your contributions.</p>
        <Link className="text-link" to="/goals">
          Create a goal
        </Link>
      </section>
    )
  const summary = goalSummary(data, goal, today)
  return (
    <section className="goal-preview">
      <div className="section-heading">
        <h2>{goal.name}</h2>
        <Link to="/goals" className="text-link">
          View
        </Link>
      </div>
      <div className="row">
        <span>
          {shortMoney(summary.saved)}{' '}
          <span className="muted">/ {shortMoney(goal.targetCents)}</span>
        </span>
        <span className="muted">{Math.round(summary.progress)}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={`${goal.name} progress`}
        aria-valuenow={summary.progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-fill" style={{ width: `${summary.progress}%` }} />
      </div>
      <p className="muted small">
        {summary.complete
          ? 'Goal reached'
          : summary.overdue
            ? 'Past target date'
            : `${shortMoney(summary.monthly!)} / month · ${summary.count} contributions left`}
      </p>
    </section>
  )
}
