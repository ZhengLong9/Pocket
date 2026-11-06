import { dateInMonth, daysInMonth, shiftMonth } from './dates'
import type { FinanceState } from './model'

export function emptyState(): FinanceState {
  return {
    version: 1,
    categories: [
      { id: 'food', name: 'Food', kind: 'variable' },
      { id: 'transport', name: 'Transport', kind: 'variable' },
      { id: 'shopping', name: 'Shopping', kind: 'variable' },
      { id: 'bills', name: 'Bills', kind: 'fixed' },
    ],
    expenses: [],
    defaultBudget: {
      limitCents: 100_000,
      categoryLimits: { food: 40_000, transport: 12_000, shopping: 18_000, bills: 30_000 },
    },
    budgets: {},
    bills: [],
    goals: [],
    contributions: [],
  }
}

export function demoState(today: string): FinanceState {
  const state = emptyState()
  const month = today.slice(0, 7),
    previousMonth = shiftMonth(month, -1)
  const day = Number(today.slice(8, 10))
  const add = (amountCents: number, description: string, categoryId: string, date: string) => {
    state.expenses.push({
      id: `sample-${state.expenses.length}`,
      amountCents,
      description,
      categoryId,
      date,
      createdAt: new Date(`${date}T00:00:00+08:00`).toISOString(),
    })
  }
  add(20_000, 'Household contribution', 'bills', dateInMonth(month, 1))
  add(1200, 'Lunch', 'food', today)
  add(240, 'MRT', 'transport', today)
  add(1600, 'Groceries', 'food', dateInMonth(month, Math.max(1, day - 1)))
  add(800, 'Online purchase', 'shopping', dateInMonth(month, Math.max(1, day - 2)))
  add(760, 'Bus and MRT', 'transport', dateInMonth(month, Math.max(1, day - 3)))
  add(24_000, 'Household contribution', 'bills', dateInMonth(previousMonth, 1))
  for (let index = 1; index <= daysInMonth(previousMonth); index++) {
    add(
      index % 5 === 0 ? 1850 : 1450,
      index % 5 === 0 ? 'Groceries' : 'Lunch and transport',
      index % 3 === 0 ? 'transport' : 'food',
      dateInMonth(previousMonth, index),
    )
  }
  state.bills = [
    { id: 'phone', name: 'Phone plan', amountCents: 4000, categoryId: 'bills', day: 18 },
    { id: 'utilities', name: 'Utilities', amountCents: 12_000, categoryId: 'bills', day: 28 },
  ]
  state.goals = [
    {
      id: 'trip',
      name: 'Trip fund',
      targetCents: 250_000,
      startingCents: 50_000,
      deadline: dateInMonth(shiftMonth(month, 5), day),
    },
  ]
  return state
}
