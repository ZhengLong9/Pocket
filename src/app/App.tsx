import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowDownToLine,
  ChartNoAxesCombined,
  ChartPie,
  Check,
  Flag,
  LayoutDashboard,
  List,
  Plus,
  X,
} from 'lucide-react'
import { ExpenseDialog } from '../components/ExpenseDialog'
import { OverviewPage } from '../features/overview/OverviewPage'
import { TransactionsPage } from '../features/transactions/TransactionsPage'
import { useFinanceStore } from '../hooks/useFinanceStore'
import { monthLabel, shiftMonth, todayISO } from '../lib/dates'
import { formatMoney } from '../lib/money'
import type { Expense, ExpenseInput, WorkspaceMode } from '../lib/model'

const navigation = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: List },
  { path: '/budgets', label: 'Budget', icon: ChartPie },
  { path: '/goals', label: 'Goals', icon: Flag },
]
type Notice = { message: string; undo?: () => void }
const BudgetsPage = lazy(() =>
  import('../features/budgets/BudgetsPage').then((module) => ({ default: module.BudgetsPage })),
)
const GoalsPage = lazy(() =>
  import('../features/goals/GoalsPage').then((module) => ({ default: module.GoalsPage })),
)

function Workspace({
  mode,
  onModeChange,
}: {
  mode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
}) {
  const today = todayISO()
  const { data, update, storageError } = useFinanceStore(mode, today)
  const [month, setMonth] = useState(today.slice(0, 7))
  const [editorOpen, setEditorOpen] = useState(false),
    [editing, setEditing] = useState<Expense | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null),
    [notice, setNotice] = useState<Notice | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const location = useLocation()
  const title = navigation.find((item) => item.path === location.pathname)?.label ?? 'Overview'
  const months = [
    ...new Set([
      ...Array.from({ length: 12 }, (_, index) => shiftMonth(today.slice(0, 7), -index)),
      ...data.expenses.map((expense) => expense.date.slice(0, 7)),
      ...Object.keys(data.budgets),
      month,
    ]),
  ]
    .sort()
    .reverse()
  useEffect(() => {
    document.title = `${title} — Pocket`
  }, [title])
  function openEditor(expense: Expense | null = null) {
    returnFocus.current = document.activeElement as HTMLElement
    setEditing(expense)
    setEditorOpen(true)
  }
  function saveExpense(input: ExpenseInput, id?: string) {
    const previous = id ? data.expenses.find((expense) => expense.id === id) : undefined
    const expense: Expense = {
      ...input,
      id: id ?? crypto.randomUUID(),
      createdAt: previous?.createdAt ?? new Date().toISOString(),
    }
    update((current) => ({
      ...current,
      expenses: previous
        ? current.expenses.map((entry) => (entry.id === expense.id ? expense : entry))
        : [expense, ...current.expenses],
    }))
    const switched = month !== expense.date.slice(0, 7)
    setMonth(expense.date.slice(0, 7))
    setHighlightedId(expense.id)
    setEditorOpen(false)
    setNotice({
      message: `${formatMoney(expense.amountCents)} expense ${previous ? 'updated' : 'saved'}${switched ? ` to ${monthLabel(expense.date.slice(0, 7))}` : ''}.`,
      undo: () => {
        update((current) => ({
          ...current,
          expenses: previous
            ? current.expenses.map((entry) => (entry.id === expense.id ? previous : entry))
            : current.expenses.filter((entry) => entry.id !== expense.id),
        }))
        setHighlightedId(null)
        setNotice({ message: previous ? 'Previous expense restored.' : 'Expense removed.' })
      },
    })
  }
  function deleteExpense(expense: Expense) {
    update((current) => ({
      ...current,
      expenses: current.expenses.filter((entry) => entry.id !== expense.id),
    }))
    setNotice({
      message: `${expense.description || 'Expense'} deleted.`,
      undo: () => {
        update((current) => ({
          ...current,
          expenses: [...current.expenses.filter((entry) => entry.id !== expense.id), expense],
        }))
        setHighlightedId(expense.id)
        setNotice({ message: 'Expense restored.' })
      },
    })
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob),
      link = document.createElement('a')
    link.href = url
    link.download = `pocket-${mode}-${today}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="Pocket overview">
          <ChartNoAxesCombined size={24} strokeWidth={2.3} />
          <span>pocket</span>
        </NavLink>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map(({ path, label, icon: Icon }) => (
            <NavLink
              end={path === '/'}
              key={path}
              to={path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="sidebar-export" onClick={exportBackup}>
            <ArrowDownToLine size={15} />
            Export backup
          </button>
          <div className="workspace-switcher">
            <span className="workspace-avatar">{mode === 'demo' ? 'D' : 'P'}</span>
            <label>
              <span className="small muted">Workspace</span>
              <select
                aria-label="Workspace"
                value={mode}
                onChange={(event) => onModeChange(event.target.value as WorkspaceMode)}
              >
                <option value="demo">Sample data</option>
                <option value="personal">My finances</option>
              </select>
            </label>
          </div>
          <p className="storage-caption">Saved in this browser</p>
        </div>
      </aside>
      <main className="main-content" id="main-content">
        <header className="app-header">
          <div className="page-context">
            <h1>{title}</h1>
            {location.pathname !== '/goals' && (
              <select
                className="month-select"
                aria-label="Reporting month"
                value={month}
                onChange={(event) => {
                  setMonth(event.target.value)
                  setNotice(null)
                  setHighlightedId(null)
                }}
              >
                {months.map((value) => (
                  <option key={value} value={value}>
                    {monthLabel(value)}
                  </option>
                ))}
              </select>
            )}
            {mode === 'demo' && <span className="demo-label">Sample data</span>}
          </div>
          <button className="button primary add-expense-button" onClick={() => openEditor()}>
            <Plus size={16} />
            Add expense
          </button>
        </header>
        {storageError && (
          <div className="storage-error" role="alert">
            {storageError}
          </div>
        )}
        {notice && (
          <div className="toast">
            <Check size={16} aria-hidden="true" />
            <span role="status">{notice.message}</span>
            {notice.undo && (
              <button className="toast-action" onClick={notice.undo}>
                Undo
              </button>
            )}
            <button
              className="icon-button"
              aria-label="Dismiss confirmation"
              onClick={() => setNotice(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <Suspense
          fallback={
            <div className="page-body muted small" role="status">
              Loading page…
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                <OverviewPage
                  data={data}
                  month={month}
                  today={today}
                  highlightedId={highlightedId}
                  onEdit={openEditor}
                  onDelete={deleteExpense}
                />
              }
            />
            <Route
              path="/transactions"
              element={
                <TransactionsPage
                  data={data}
                  month={month}
                  highlightedId={highlightedId}
                  onEdit={openEditor}
                  onDelete={deleteExpense}
                />
              }
            />
            <Route
              path="/budgets"
              element={
                <BudgetsPage
                  key={month}
                  data={data}
                  month={month}
                  today={today}
                  update={update}
                  notify={(message) => setNotice({ message })}
                />
              }
            />
            <Route
              path="/goals"
              element={
                <GoalsPage
                  data={data}
                  today={today}
                  update={update}
                  notify={(message) => setNotice({ message })}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <footer className="app-footer">
          <span>
            {mode === 'demo' ? 'Fictional transactions and budgets' : 'Personal workspace'} · SGD
          </span>
          <span>Local version · v0.1</span>
        </footer>
      </main>
      <ExpenseDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        expense={editing}
        categories={data.categories}
        bills={data.bills}
        today={today}
        month={month}
        onSave={saveExpense}
        returnFocus={returnFocus.current}
      />
    </div>
  )
}

function initialMode(): WorkspaceMode {
  try {
    return localStorage.getItem('pocket:workspace') === 'personal' ? 'personal' : 'demo'
  } catch {
    return 'demo'
  }
}

export default function App() {
  const [mode, setMode] = useState<WorkspaceMode>(initialMode)
  function changeMode(next: WorkspaceMode) {
    setMode(next)
    try {
      localStorage.setItem('pocket:workspace', next)
    } catch {
      /* Data-store UI reports storage availability. */
    }
  }
  return (
    <BrowserRouter>
      <Workspace key={mode} mode={mode} onModeChange={changeMode} />
    </BrowserRouter>
  )
}
