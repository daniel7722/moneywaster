import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'
import {
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader,
} from 'lucide-react'
import { GetCategories } from '#/server/categories'
import {
  GetExpensesByMonth,
  UpdateExpense,
  DeleteExpense,
} from '#/server/expenses'

export const Route = createFileRoute('/ledger')({ component: Ledger })

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  _id: string
  name: string
  icon: string
}

interface Expense {
  _id: string
  categoryId: string
  categoryName: string
  categoryIcon: string
  amount: number
  note: string
  expenseDate: Date
}

interface EditState {
  categoryId: string
  amount: string
  note: string
  expenseDate: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function currentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

function buildYearOptions() {
  const y = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => y - i)
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(n)

function toISO(date: Date | string): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Shared input style ───────────────────────────────────────────────────────

const cellInputStyle: React.CSSProperties = {
  background: '#0a0a0a',
  border: '1px solid rgba(229,9,20,0.5)',
  borderRadius: 4,
  color: '#fff',
  fontSize: 13,
  fontFamily: 'inherit',
  padding: '5px 9px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({
  expense,
  onConfirm,
  onCancel,
  loading,
}: {
  expense: Expense
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        style={{
          background: '#1f1f1f',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          padding: '2rem',
          maxWidth: 400,
          width: '100%',
          animation: 'rise-in 200ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(229,9,20,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <Trash2 size={20} color="#e50914" />
        </div>
        <h2
          style={{
            margin: '0 0 8px',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          Delete expense?
        </h2>
        <p style={{ margin: '0 0 6px', fontSize: 14, color: '#b3b3b3' }}>
          {expense.categoryIcon} {expense.categoryName} —{' '}
          <strong style={{ color: '#fff' }}>{fmt(expense.amount)}</strong>
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#808080' }}>
          {formatDate(expense.expenseDate)}
          {expense.note ? ` · "${expense.note}"` : ''}
        </p>
        <p style={{ margin: '0 0 1.5rem', fontSize: 13, color: '#808080' }}>
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#e50914',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              padding: '8px 20px',
              borderRadius: 4,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader
                  size={14}
                  style={{ animation: 'spin 0.8s linear infinite' }}
                />{' '}
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={14} /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Inline-edit row ──────────────────────────────────────────────────────────

function EditRow({
  expense,
  categories,
  onSave,
  onCancel,
  saving,
  saveError,
}: {
  expense: Expense
  categories: Category[]
  onSave: (id: string, edit: EditState) => void
  onCancel: () => void
  saving: boolean
  saveError: string | null
}) {
  const [edit, setEdit] = useState<EditState>({
    categoryId: expense.categoryId,
    amount: String(expense.amount),
    note: expense.note,
    expenseDate: toISO(expense.expenseDate),
  })

  function set(field: keyof EditState, value: string) {
    setEdit((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (
        e.key === 'Enter' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        onSave(expense._id, edit)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [edit, expense._id, onSave, onCancel])

  const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    verticalAlign: 'middle',
    background: 'rgba(229,9,20,0.05)',
    borderBottom: '1px solid rgba(229,9,20,0.15)',
  }

  return (
    <>
      <tr>
        <td style={tdStyle}>
          <input
            type="date"
            value={edit.expenseDate}
            max={todayISO()}
            onChange={(e) => set('expenseDate', e.target.value)}
            style={{ ...cellInputStyle, colorScheme: 'dark', minWidth: 130 }}
          />
        </td>
        <td style={tdStyle}>
          <select
            value={edit.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            style={{
              ...cellInputStyle,
              appearance: 'none',
              WebkitAppearance: 'none',
              minWidth: 120,
            }}
          >
            {categories.map((c) => (
              <option
                key={c._id}
                value={c._id}
                style={{ background: '#1f1f1f' }}
              >
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </td>
        <td style={tdStyle}>
          <div style={{ position: 'relative', minWidth: 100 }}>
            <span
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#808080',
                fontSize: 13,
                pointerEvents: 'none',
              }}
            >
              £
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={edit.amount}
              onChange={(e) => set('amount', e.target.value)}
              style={{ ...cellInputStyle, paddingLeft: 22 }}
              autoFocus
            />
          </div>
        </td>
        <td style={tdStyle}>
          <input
            type="text"
            placeholder="Add a note…"
            value={edit.note}
            onChange={(e) => set('note', e.target.value)}
            maxLength={280}
            style={{ ...cellInputStyle, minWidth: 160 }}
          />
        </td>
        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onSave(expense._id, edit)}
              disabled={saving}
              title="Save (Enter)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#e50914',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? (
                <Loader
                  size={12}
                  style={{ animation: 'spin 0.8s linear infinite' }}
                />
              ) : (
                <Check size={12} />
              )}
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              title="Cancel (Esc)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'transparent',
                color: '#808080',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                padding: '5px 8px',
                cursor: 'pointer',
              }}
            >
              <X size={12} />
            </button>
          </div>
        </td>
      </tr>
      {saveError && (
        <tr>
          <td
            colSpan={5}
            style={{
              padding: '6px 12px',
              background: 'rgba(229,9,20,0.08)',
              borderBottom: '1px solid rgba(229,9,20,0.2)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: '#ff6b6b',
              }}
            >
              <AlertCircle size={12} />
              {saveError}
            </span>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Static read row ──────────────────────────────────────────────────────────

function ReadRow({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense
  onEdit: () => void
  onDelete: () => void
}) {
  const [hover, setHover] = useState(false)

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    verticalAlign: 'middle',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    fontSize: 13,
    color: '#fff',
    background: hover ? 'rgba(255,255,255,0.03)' : 'transparent',
    transition: 'background 120ms ease',
  }

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td style={{ ...tdStyle, color: '#b3b3b3', whiteSpace: 'nowrap' }}>
        {formatDate(expense.expenseDate)}
      </td>
      <td style={tdStyle}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{expense.categoryIcon}</span>
          <span style={{ color: '#e0e0e0' }}>{expense.categoryName}</span>
        </span>
      </td>
      <td
        style={{
          ...tdStyle,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {fmt(expense.amount)}
      </td>
      <td
        style={{
          ...tdStyle,
          color: expense.note ? '#b3b3b3' : '#404040',
          fontStyle: expense.note ? 'normal' : 'italic',
        }}
      >
        {expense.note || 'No note'}
      </td>
      <td
        style={{
          ...tdStyle,
          opacity: hover ? 1 : 0,
          transition: 'opacity 120ms ease',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              color: '#b3b3b3',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 4,
              padding: '4px 10px',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'color 120ms, border-color 120ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#b3b3b3'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
            }}
          >
            <Pencil size={11} />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              color: '#808080',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              padding: '4px 10px',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'color 120ms, border-color 120ms, background 120ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#e50914'
              e.currentTarget.style.borderColor = 'rgba(229,9,20,0.4)'
              e.currentTarget.style.background = 'rgba(229,9,20,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#808080'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function Ledger() {
  const { month: initMonth, year: initYear } = currentMonthYear()

  const [month, setMonth] = useState(initMonth)
  const [year, setYear] = useState(initYear)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    setEditingId(null)
    setSaveError(null)
    try {
      const [rows, cats] = await Promise.all([
        GetExpensesByMonth({ data: { month, year } }),
        GetCategories(),
      ])
      setExpenses(rows)
      setCategories(cats)
    } catch {
      setLoadError(
        'Failed to load expenses. Check your connection and try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    void load()
  }, [load])

  // ── Month navigation ───────────────────────────────────────────────────────

  function prevMonth() {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }

  function nextMonth() {
    const now = currentMonthYear()
    if (year === now.year && month === now.month) return
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }

  const isCurrentMonth =
    month === currentMonthYear().month && year === currentMonthYear().year

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = useCallback(
    async (id: string, edit: EditState) => {
      const amt = parseFloat(edit.amount)
      if (!edit.amount || isNaN(amt) || amt <= 0) {
        setSaveError('Amount must be a positive number')
        return
      }
      if (!edit.expenseDate) {
        setSaveError('Date is required')
        return
      }
      setSaving(true)
      setSaveError(null)
      try {
        await UpdateExpense({
          data: {
            id,
            categoryId: edit.categoryId,
            amount: amt,
            note: edit.note.trim() || undefined,
            expenseDate: new Date(edit.expenseDate),
          },
        })
        setEditingId(null)
        await load()
      } catch {
        setSaveError('Failed to save. Please try again.')
      } finally {
        setSaving(false)
      }
    },
    [load],
  )

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!deletingExpense) return
    setDeleteLoading(true)
    try {
      await DeleteExpense({ data: { id: deletingExpense._id } })
      setDeletingExpense(null)
      await load()
    } catch {
      setDeletingExpense(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const monthTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#808080',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    whiteSpace: 'nowrap',
    background: '#0d0d0d',
  }

  return (
    <main className="page-wrap" style={{ padding: '2rem 0 4rem' }}>
      {/* ── Page header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <p className="kicker" style={{ margin: '0 0 4px' }}>
            Ledger
          </p>
          <h1
            style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}
          >
            Expense History
          </h1>
        </div>

        {/* Month navigator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '4px',
          }}
        >
          <button
            type="button"
            onClick={prevMonth}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: '#b3b3b3',
              cursor: 'pointer',
              borderRadius: 6,
              width: 32,
              height: 32,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.background = '#303030'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#b3b3b3'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 8px',
            }}
          >
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1} style={{ background: '#141414' }}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            >
              {buildYearOptions().map((y) => (
                <option key={y} value={y} style={{ background: '#141414' }}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={nextMonth}
            disabled={isCurrentMonth}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: isCurrentMonth ? '#404040' : '#b3b3b3',
              cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
              borderRadius: 6,
              width: 32,
              height: 32,
            }}
            onMouseEnter={(e) => {
              if (!isCurrentMonth) {
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.background = '#303030'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isCurrentMonth
                ? '#404040'
                : '#b3b3b3'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Summary strip ── */}
      {!loading && !loadError && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Total Spent', value: fmt(monthTotal), highlight: true },
            {
              label: 'Transactions',
              value: String(expenses.length),
              highlight: false,
            },
            {
              label: 'Average',
              value: expenses.length ? fmt(monthTotal / expenses.length) : '—',
              highlight: false,
            },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              style={{
                background: '#141414',
                border: `1px solid ${highlight ? 'rgba(229,9,20,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8,
                padding: '12px 20px',
                flex: '1 1 120px',
              }}
            >
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#808080',
                }}
              >
                {label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: highlight ? '#e50914' : '#fff',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Table card ── */}
      <div
        style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Card header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p
            style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#fff' }}
          >
            {MONTHS_SHORT[month - 1]} {year}
            {!loading && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  color: '#808080',
                  fontWeight: 400,
                }}
              >
                {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </p>
          {editingId && (
            <span style={{ fontSize: 12, color: '#808080' }}>
              Press{' '}
              <kbd
                style={{
                  background: '#303030',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 3,
                  padding: '1px 5px',
                  fontSize: 11,
                }}
              >
                Enter
              </kbd>{' '}
              to save ·{' '}
              <kbd
                style={{
                  background: '#303030',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 3,
                  padding: '1px 5px',
                  fontSize: 11,
                }}
              >
                Esc
              </kbd>{' '}
              to cancel
            </span>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div
            style={{
              padding: '1.5rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: 40,
                  background: '#1f1f1f',
                  borderRadius: 6,
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Load error */}
        {!loading && loadError && (
          <div
            style={{
              padding: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#ff6b6b',
              fontSize: 14,
            }}
          >
            <AlertCircle size={16} />
            {loadError}
            <button
              type="button"
              onClick={() => void load()}
              style={{
                marginLeft: 4,
                background: 'transparent',
                border: 'none',
                color: '#e50914',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !loadError && expenses.length === 0 && (
          <div
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 36 }}>📭</span>
            <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>
              No expenses in {MONTHS[month - 1]} {year}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#808080' }}>
              Log one or navigate to a different month.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !loadError && expenses.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Amount</th>
                  <th style={{ ...thStyle, width: '100%' }}>Note</th>
                  <th style={{ ...thStyle, minWidth: 110 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) =>
                  editingId === expense._id ? (
                    <EditRow
                      key={expense._id}
                      expense={expense}
                      categories={categories}
                      onSave={handleSave}
                      onCancel={() => {
                        setEditingId(null)
                        setSaveError(null)
                      }}
                      saving={saving}
                      saveError={saveError}
                    />
                  ) : (
                    <ReadRow
                      key={expense._id}
                      expense={expense}
                      onEdit={() => {
                        setEditingId(expense._id)
                        setSaveError(null)
                      }}
                      onDelete={() => setDeletingExpense(expense)}
                    />
                  ),
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      padding: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      fontSize: 12,
                      color: '#808080',
                      fontWeight: 500,
                    }}
                  >
                    {expenses.length}{' '}
                    {expenses.length === 1 ? 'transaction' : 'transactions'}
                  </td>
                  <td
                    colSpan={3}
                    style={{
                      padding: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#fff',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {fmt(monthTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete modal ── */}
      {deletingExpense && (
        <DeleteModal
          expense={deletingExpense}
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={() => setDeletingExpense(null)}
          loading={deleteLoading}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes rise-in {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button { -webkit-appearance:none; }
        input[type='number'] { -moz-appearance:textfield; }
        input[type='date']::-webkit-calendar-picker-indicator { filter:invert(0.6); cursor:pointer; }
      `}</style>
    </main>
  )
}
