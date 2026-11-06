import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { goalSummary } from '../../lib/finance'
import { dateLabel, isISODate } from '../../lib/dates'
import { formatMoney, parseMoney, shortMoney } from '../../lib/money'
import type { FinanceState, Goal } from '../../lib/model'

export function GoalsPage({
  data,
  today,
  update,
  notify,
}: {
  data: FinanceState
  today: string
  update: (change: (current: FinanceState) => FinanceState) => void
  notify: (message: string) => void
}) {
  const [creating, setCreating] = useState(false),
    [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [error, setError] = useState('')
  const returnFocus = useRef<HTMLElement | null>(null)
  const rememberFocus = () => {
    returnFocus.current = document.activeElement as HTMLElement
    setError('')
  }
  return (
    <div className="page-body goals-page">
      <div className="section-heading">
        <h2>Savings goals</h2>
        <button
          className="button"
          onClick={() => {
            rememberFocus()
            setCreating(true)
          }}
        >
          <Plus size={14} />
          New goal
        </button>
      </div>
      {!data.goals.length && (
        <div className="empty-state">
          <h3>No goals yet</h3>
          <p>Create a goal with a target amount and date.</p>
        </div>
      )}
      {data.goals.map((goal) => {
        const summary = goalSummary(data, goal, today)
        const entries = data.contributions
          .filter((entry) => entry.goalId === goal.id)
          .sort((a, b) => b.date.localeCompare(a.date))
        return (
          <article className="goal-detail" key={goal.id}>
            <div>
              <div className="section-heading">
                <h2>{goal.name}</h2>
                <span className="muted small">
                  Target · {dateLabel(goal.deadline)} {goal.deadline.slice(0, 4)}
                </span>
              </div>
              <div className="goal-value">
                {formatMoney(summary.saved)}{' '}
                <span className="muted">/ {shortMoney(goal.targetCents)}</span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label={`${goal.name} saved`}
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
                    ? `${shortMoney(summary.remaining)} remaining · past target date`
                    : `${shortMoney(summary.monthly!)} per month · ${summary.count} monthly contributions remaining`}
              </p>
            </div>
            <div className="goal-contributions">
              <button
                className="button primary"
                onClick={() => {
                  rememberFocus()
                  setSelectedGoal(goal)
                }}
              >
                <Plus size={14} />
                Record contribution
              </button>
              {entries.slice(0, 3).map((entry) => (
                <div className="contribution-row" key={entry.id}>
                  <span className="muted small">{dateLabel(entry.date)}</span>
                  <span>{formatMoney(entry.amountCents)}</span>
                </div>
              ))}
              <p className="small muted goal-note">Recorded savings stay separate from expenses.</p>
            </div>
          </article>
        )
      })}
      <Modal
        open={creating}
        onOpenChange={setCreating}
        title="New savings goal"
        description="Set a name, target, current savings, and deadline."
        returnFocus={returnFocus.current}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const fields = new FormData(event.currentTarget)
            const target = parseMoney(String(fields.get('target'))),
              starting = parseMoney(String(fields.get('starting')) || '0')
            const deadline = String(fields.get('deadline')),
              name = String(fields.get('name')).trim()
            if (
              !name ||
              target === null ||
              target <= 0 ||
              starting === null ||
              !isISODate(deadline) ||
              deadline < today
            ) {
              setError('Check the amounts and choose a target date today or later.')
              return
            }
            update((current) => ({
              ...current,
              goals: [
                ...current.goals,
                {
                  id: crypto.randomUUID(),
                  name,
                  targetCents: target,
                  startingCents: starting,
                  deadline,
                },
              ],
            }))
            setCreating(false)
            notify('Savings goal created.')
          }}
        >
          <div className="modal-fields">
            <label className="field">
              Goal name
              <input name="name" required maxLength={60} autoFocus />
            </label>
            <div className="field-pair">
              <label className="field">
                Target (SGD)
                <input name="target" required inputMode="decimal" />
              </label>
              <label className="field">
                Already saved (SGD)
                <input name="starting" defaultValue="0.00" inputMode="decimal" />
              </label>
            </div>
            <label className="field">
              Target date
              <input name="deadline" type="date" required min={today} />
            </label>
            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}
          </div>
          <footer className="modal-footer">
            <button type="button" className="button" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" className="button primary">
              Create goal
            </button>
          </footer>
        </form>
      </Modal>
      <Modal
        open={!!selectedGoal}
        onOpenChange={(open) => {
          if (!open) setSelectedGoal(null)
        }}
        title="Record contribution"
        description="Record money already set aside for this goal."
        returnFocus={returnFocus.current}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const fields = new FormData(event.currentTarget),
              amount = parseMoney(String(fields.get('amount'))),
              date = String(fields.get('date'))
            if (
              !selectedGoal ||
              amount === null ||
              amount <= 0 ||
              !isISODate(date) ||
              date > today
            ) {
              setError('Check the amount and choose today or an earlier date.')
              return
            }
            update((current) => ({
              ...current,
              contributions: [
                ...current.contributions,
                { id: crypto.randomUUID(), goalId: selectedGoal.id, amountCents: amount, date },
              ],
            }))
            setSelectedGoal(null)
            notify('Savings contribution recorded.')
          }}
        >
          <div className="modal-fields">
            <p className="muted">{selectedGoal?.name}</p>
            <label className="field">
              Amount (SGD)
              <input name="amount" required inputMode="decimal" autoFocus />
            </label>
            <label className="field">
              Date
              <input name="date" type="date" required max={today} defaultValue={today} />
            </label>
            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}
          </div>
          <footer className="modal-footer">
            <button type="button" className="button" onClick={() => setSelectedGoal(null)}>
              Cancel
            </button>
            <button type="submit" className="button primary">
              Record contribution
            </button>
          </footer>
        </form>
      </Modal>
    </div>
  )
}
