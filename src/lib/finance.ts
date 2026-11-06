import { contributionCount, dateInMonth, daysInMonth } from './dates'
import type { Expense, FinanceState, Goal } from './model'

export function monthExpenses(state: FinanceState, month: string): Expense[] {
  return state.expenses
    .filter((expense) => expense.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export function monthBudget(state: FinanceState, month: string) {
  return state.budgets[month] ?? state.defaultBudget
}

export function monthSummary(state: FinanceState, month: string, today: string) {
  const expenses = monthExpenses(state, month)
  const budget = monthBudget(state, month)
  const spent = expenses.reduce((total, expense) => total + expense.amountCents, 0)
  const fixedIds = new Set(
    state.categories.filter((category) => category.kind === 'fixed').map((category) => category.id),
  )
  const fixed = expenses
    .filter((expense) => fixedIds.has(expense.categoryId))
    .reduce((total, expense) => total + expense.amountCents, 0)
  const matchedBills = new Set(
    expenses.flatMap((expense) => (expense.billId ? [expense.billId] : [])),
  )
  const pendingBills = state.bills.filter((bill) => !matchedBills.has(bill.id))
  const pendingFixed = pendingBills.reduce((total, bill) => total + bill.amountCents, 0)
  const isPast = month < today.slice(0, 7)
  const isFuture = month > today.slice(0, 7)
  const elapsed = isPast ? daysInMonth(month) : isFuture ? 0 : Number(today.slice(8, 10))
  // Closed months use actual expenses. Future variable spending has no observed basis.
  const forecast = isPast
    ? spent
    : isFuture
      ? null
      : fixed + pendingFixed + Math.round(((spent - fixed) / elapsed) * daysInMonth(month))
  const categories = state.categories.map((category) => ({
    ...category,
    spent: expenses
      .filter((expense) => expense.categoryId === category.id)
      .reduce((total, expense) => total + expense.amountCents, 0),
    limit: budget.categoryLimits[category.id] ?? 0,
  }))
  return {
    expenses,
    budget,
    spent,
    remaining: budget.limitCents - spent,
    forecast,
    categories,
    elapsed,
    isPast,
    isFuture,
    pendingFixed,
    pendingBills: pendingBills.map((bill) => ({ ...bill, dueDate: dateInMonth(month, bill.day) })),
  }
}

export function spendingSeries(state: FinanceState, month: string, today: string) {
  const summary = monthSummary(state, month, today)
  let cumulative = 0
  return Array.from({ length: daysInMonth(month) }, (_, index) => {
    const day = index + 1
    const date = dateInMonth(month, day)
    cumulative += summary.expenses
      .filter((expense) => expense.date === date)
      .reduce((total, expense) => total + expense.amountCents, 0)
    const futureDay = day > summary.elapsed
    const forecast =
      summary.forecast === null
        ? null
        : day === summary.elapsed
          ? summary.spent / 100
          : futureDay && !summary.isPast
            ? (summary.spent +
                ((summary.forecast - summary.spent) * (day - summary.elapsed)) /
                  (daysInMonth(month) - summary.elapsed)) /
              100
            : null
    return { day, actual: futureDay ? null : cumulative / 100, projected: forecast }
  })
}

export function goalSummary(state: FinanceState, goal: Goal, today: string) {
  const saved =
    goal.startingCents +
    state.contributions
      .filter((entry) => entry.goalId === goal.id)
      .reduce((total, entry) => total + entry.amountCents, 0)
  const remaining = Math.max(0, goal.targetCents - saved)
  const count = contributionCount(today, goal.deadline)
  return {
    saved,
    remaining,
    count,
    complete: remaining === 0,
    overdue: remaining > 0 && goal.deadline < today,
    monthly: remaining === 0 ? 0 : count > 0 ? Math.ceil(remaining / count) : null,
    progress: Math.min(100, (saved / goal.targetCents) * 100),
  }
}
