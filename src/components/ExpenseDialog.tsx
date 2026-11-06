import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from './Modal'
import { isISODate, monthLabel } from '../lib/dates'
import { moneyInput, parseMoney } from '../lib/money'
import type { Category, Expense, ExpenseInput, RecurringBill } from '../lib/model'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  bills: RecurringBill[]
  expense: Expense | null
  today: string
  month: string
  onSave: (input: ExpenseInput, id?: string) => void
  returnFocus: HTMLElement | null
}

function expenseFormSchema(today: string, categoryIds: string[]) {
  return z.object({
    amount: z
      .string()
      .refine(
        (value) => (parseMoney(value) ?? 0) > 0,
        'Enter a valid amount with up to two decimal places.',
      ),
    description: z.string().trim().max(100, 'Use 100 characters or fewer.'),
    categoryId: z.string().refine((id) => categoryIds.includes(id), 'Choose a category.'),
    date: z
      .string()
      .refine(isISODate, 'Enter a valid date.')
      .refine((value) => value <= today, 'Choose today or an earlier date.'),
    billId: z.string(),
  })
}
type Fields = z.infer<ReturnType<typeof expenseFormSchema>>

export function ExpenseDialog({
  open,
  onOpenChange,
  categories,
  bills,
  expense,
  today,
  month,
  onSave,
  returnFocus,
}: Props) {
  const blank = () => ({ amount: '', description: '', categoryId: '', date: today, billId: '' })
  const session = useRef<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Fields>({
    resolver: zodResolver(
      expenseFormSchema(
        today,
        categories.map((category) => category.id),
      ),
    ),
    defaultValues: blank(),
  })
  useEffect(() => {
    if (!open) return
    const next = expense?.id ?? 'new'
    if (session.current === next) return
    reset(
      expense
        ? {
            amount: moneyInput(expense.amountCents),
            description: expense.description,
            categoryId: expense.categoryId,
            date: expense.date,
            billId: expense.billId ?? '',
          }
        : blank(),
    )
    session.current = next
  }, [open, expense, reset, today])
  const date = watch('date'),
    categoryId = watch('categoryId')
  const matchingBills = bills.filter((bill) => bill.categoryId === categoryId)
  const fieldError = (name: keyof Fields) =>
    errors[name] ? (
      <span id={`${name}-error`} className="field-error" role="alert">
        {errors[name]?.message}
      </span>
    ) : null
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={expense ? 'Edit expense' : 'Add expense'}
      description="Enter an expense amount in SGD, a category, and its transaction date."
      returnFocus={returnFocus}
    >
      <form
        noValidate
        onSubmit={handleSubmit((values) => {
          onSave(
            {
              amountCents: parseMoney(values.amount)!,
              description: values.description,
              categoryId: values.categoryId,
              date: values.date,
              ...(matchingBills.some((bill) => bill.id === values.billId)
                ? { billId: values.billId }
                : {}),
            },
            expense?.id,
          )
          reset(blank())
          session.current = null
        })}
      >
        <div className="modal-fields">
          <label className="field">
            Amount
            <span className="currency-input">
              <span aria-hidden="true">S$</span>
              <input
                {...register('amount')}
                autoFocus
                inputMode="decimal"
                autoComplete="off"
                aria-label="Amount in SGD"
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
              />
            </span>
            {fieldError('amount')}
          </label>
          <label className="field">
            <span>
              Description <span className="optional">(optional)</span>
            </span>
            <input {...register('description')} maxLength={100} autoComplete="off" />
            {fieldError('description')}
          </label>
          <div className="field-pair">
            <label className="field">
              Category
              <select
                {...register('categoryId')}
                aria-label="Category"
                aria-invalid={!!errors.categoryId}
                aria-describedby={errors.categoryId ? 'categoryId-error' : undefined}
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {fieldError('categoryId')}
            </label>
            <label className="field">
              Date
              <input
                type="date"
                {...register('date')}
                aria-label="Date"
                max={today}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? 'date-error' : undefined}
              />
              {fieldError('date')}
            </label>
          </div>
          {matchingBills.length > 0 && (
            <label className="field">
              Scheduled bill? 
              <select {...register('billId')}>
                <option value="">No</option>
                {matchingBills.map((bill) => (
                  <option key={bill.id} value={bill.id}>
                    {bill.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {isISODate(date) && date.slice(0, 7) !== month && (
            <p className="field-hint">
              Overview will switch to {monthLabel(date.slice(0, 7))} after saving.
            </p>
          )}
        </div>
        <footer className="modal-footer">
          <button type="button" className="button" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            {expense ? 'Save changes' : 'Save expense'}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
