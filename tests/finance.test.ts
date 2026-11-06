import { describe, expect, it } from 'vitest'
import { contributionCount, dateInMonth, daysInMonth, todayISO } from '../src/lib/dates'
import { goalSummary, monthSummary, spendingSeries } from '../src/lib/finance'
import { parseMoney } from '../src/lib/money'
import { demoState, emptyState } from '../src/lib/seed'
import { financeStateSchema } from '../src/lib/model'

const today = '2026-11-06'

describe('currency amounts', () => {
  it('parses cents exactly and rejects extra precision, negatives, and exponent notation', () => {
    expect(parseMoney('0.29')).toBe(29)
    expect(parseMoney('12.3')).toBe(1230)
    expect(parseMoney(' 1000.00 ')).toBe(100_000)
    for (const value of ['1.001', '-5', '1e3', '', 'Infinity', '1,000', '1000001'])
      expect(parseMoney(value)).toBeNull()
  })
})

describe('calendar boundaries', () => {
  it('handles leap years and clamps a recurring day to the end of February', () => {
    expect(daysInMonth('2024-02')).toBe(29)
    expect(daysInMonth('2027-02')).toBe(28)
    expect(dateInMonth('2027-02', 31)).toBe('2027-02-28')
  })
  it('uses Singapore calendar dates across the UTC day boundary', () => {
    expect(todayISO(new Date('2026-11-05T16:30:00Z'))).toBe('2026-11-06')
  })
  it('counts monthly contributions across a year boundary', () => {
    expect(contributionCount(today, '2027-04-06')).toBe(5)
    expect(contributionCount(today, '2026-10-01')).toBe(0)
  })
})

describe('spending and projections', () => {
  it('uses one coherent dataset for the table, categories, and chart', () => {
    const state = demoState(today),
      summary = monthSummary(state, '2026-11', today)
    expect(financeStateSchema.safeParse(state).success).toBe(true)
    expect(summary.spent).toBe(24_600)
    expect(summary.remaining).toBe(75_400)
    expect(summary.categories.reduce((sum, category) => sum + category.spent, 0)).toBe(
      summary.spent,
    )
    expect(spendingSeries(state, '2026-11', today)[5].actual).toBe(246)
  })
  it('projects variable spending and adds upcoming fixed bills once', () => {
    expect(monthSummary(demoState(today), '2026-11', today).forecast).toBe(59_000)
  })
  it('does not count a linked scheduled bill twice', () => {
    const state = demoState(today)
    state.expenses.push({
      id: 'phone-paid',
      amountCents: 4000,
      categoryId: 'bills',
      date: today,
      description: 'Phone plan',
      billId: 'phone',
      createdAt: `${today}T14:00:00Z`,
    })
    const result = monthSummary(state, '2026-11', today)
    expect(result.spent).toBe(28_600)
    expect(result.pendingFixed).toBe(12_000)
    expect(result.forecast).toBe(59_000)
  })
  it('uses actual spending for closed months and no variable prediction for future months', () => {
    const state = demoState(today)
    const past = monthSummary(state, '2026-10', today)
    expect(past.forecast).toBe(past.spent)
    expect(monthSummary(state, '2026-12', today).forecast).toBeNull()
  })
  it('keeps chart projection joined to actual spending without inventing future recorded values', () => {
    const points = spendingSeries(demoState(today), '2026-11', today)
    expect(points[5].projected).toBe(points[5].actual)
    expect(points[6].actual).toBeNull()
    expect(points.at(-1)?.projected).toBe(590)
  })
  it('handles zero budgets and an empty first day without division by zero', () => {
    const state = emptyState()
    state.defaultBudget.limitCents = 0
    const result = monthSummary(state, '2026-11', '2026-11-01')
    expect(result.remaining).toBe(0)
    expect(result.forecast).toBe(0)
    expect(
      spendingSeries(state, '2026-11', '2026-11-01').every(
        (point) => point.actual === null || Number.isFinite(point.actual),
      ),
    ).toBe(true)
  })
})

describe('savings goals', () => {
  it('rounds the required contribution upward and keeps savings separate from spending', () => {
    const state = demoState(today),
      goal = state.goals[0]
    state.contributions.push({ id: 'saved', goalId: goal.id, amountCents: 1, date: today })
    expect(goalSummary(state, goal, today).monthly).toBe(40_000)
    expect(monthSummary(state, '2026-11', today).spent).toBe(24_600)
  })
  it('recognises completed and overdue goals without dividing by zero', () => {
    const state = demoState(today),
      goal = state.goals[0]
    expect(goalSummary(state, { ...goal, startingCents: 250_000 }, today).monthly).toBe(0)
    const overdue = goalSummary(state, { ...goal, deadline: '2026-10-31' }, today)
    expect(overdue.overdue).toBe(true)
    expect(overdue.monthly).toBeNull()
  })
})
