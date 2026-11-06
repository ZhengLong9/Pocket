import { z } from 'zod'
import { isISODate } from './dates'

const date = z.string().refine(isISODate, 'Enter a valid date.')
const cents = z.number().int().min(0).max(100_000_000)
const id = z.string().min(1).max(100)
export const categorySchema = z.object({
  id,
  name: z.string().trim().min(1).max(40),
  kind: z.enum(['variable', 'fixed']),
})
export const expenseSchema = z.object({
  id,
  amountCents: cents.positive(),
  date,
  categoryId: id,
  description: z.string().max(100),
  billId: id.optional(),
  createdAt: z.string(),
})
const budgetSchema = z.object({
  limitCents: cents,
  categoryLimits: z.record(z.string(), cents),
})
const billSchema = z.object({
  id,
  name: z.string().min(1).max(60),
  amountCents: cents.positive(),
  categoryId: id,
  day: z.number().int().min(1).max(31),
})
const goalSchema = z.object({
  id,
  name: z.string().trim().min(1).max(60),
  targetCents: cents.positive(),
  startingCents: cents,
  deadline: date,
})
const contributionSchema = z.object({ id, goalId: id, amountCents: cents.positive(), date })

export const financeStateSchema = z.object({
  version: z.literal(1),
  categories: z.array(categorySchema).max(100),
  expenses: z.array(expenseSchema).max(100_000),
  defaultBudget: budgetSchema,
  budgets: z.record(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), budgetSchema),
  bills: z.array(billSchema).max(100),
  goals: z.array(goalSchema).max(100),
  contributions: z.array(contributionSchema).max(10_000),
})

export type Category = z.infer<typeof categorySchema>
export type Expense = z.infer<typeof expenseSchema>
export type ExpenseInput = Omit<Expense, 'id' | 'createdAt'>
export type Budget = z.infer<typeof budgetSchema>
export type RecurringBill = z.infer<typeof billSchema>
export type Goal = z.infer<typeof goalSchema>
export type FinanceState = z.infer<typeof financeStateSchema>
export type WorkspaceMode = 'demo' | 'personal'
