import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle, AlertCircle, PlusCircle, Loader } from 'lucide-react'
import { GetCategories } from '#/server/categories'
import { AddExpense } from '#/server/expenses'

export const Route = createFileRoute('/log')({ component: LogExpense })

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  _id: string
  name: string
  icon: string
}

interface FormState {
  categoryId: string
  amount: string
  note: string
  expenseDate: string
}

interface FieldErrors {
  categoryId?: string
  amount?: string
  expenseDate?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function validate(form: FormState, categories: Category[]): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.categoryId || !categories.find((c) => c._id === form.categoryId)) {
    errors.categoryId = 'Please select a category'
  }
  const amt = parseFloat(form.amount)
  if (!form.amount || isNaN(amt) || amt <= 0) {
    errors.amount = 'Enter a positive amount'
  }
  if (amt > 1_000_000) {
    errors.amount = 'Amount seems too large'
  }
  if (!form.expenseDate) {
    errors.expenseDate = 'Pick a date'
  }
  return errors
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: '#b3b3b3',
        marginBottom: 8,
      }}
    >
      {children}
    </label>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p
      style={{
        margin: '6px 0 0',
        fontSize: 12,
        color: '#e50914',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <AlertCircle size={12} />
      {msg}
    </p>
  )
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: '#1f1f1f',
    border: `1px solid ${hasError ? '#e50914' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 6,
    color: '#fff',
    fontSize: 15,
    fontFamily: 'inherit',
    padding: '11px 14px',
    outline: 'none',
    transition: 'border-color 150ms ease',
    boxSizing: 'border-box',
  }
}

// ─── Category card picker ─────────────────────────────────────────────────────

function CategoryPicker({
  categories,
  value,
  onChange,
  error,
  loading,
}: {
  categories: Category[]
  value: string
  onChange: (id: string) => void
  error?: string
  loading: boolean
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 90,
              height: 72,
              background: '#1f1f1f',
              borderRadius: 8,
              animation: 'pulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div
        style={{
          background: '#1f1f1f',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '1.25rem',
          fontSize: 13,
          color: '#808080',
          textAlign: 'center',
        }}
      >
        No categories yet. Create one first via the test button.
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {categories.map((cat) => {
          const selected = value === cat._id
          return (
            <button
              key={cat._id}
              type="button"
              onClick={() => onChange(cat._id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: 90,
                padding: '12px 8px',
                background: selected ? 'rgba(229,9,20,0.15)' : '#1f1f1f',
                border: `1.5px solid ${selected ? '#e50914' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                outline: 'none',
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1 }}>{cat.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: selected ? '#fff' : '#b3b3b3',
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  lineHeight: 1.2,
                }}
              >
                {cat.name}
              </span>
            </button>
          )
        })}
      </div>
      <FieldError msg={error} />
    </>
  )
}

// ─── Success banner ───────────────────────────────────────────────────────────

function SuccessBanner({
  amount,
  categoryIcon,
  categoryName,
  onAnother,
  onDashboard,
}: {
  amount: number
  categoryIcon: string
  categoryName: string
  onAnother: () => void
  onDashboard: () => void
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(n)

  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '2.5rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        animation: 'rise-in 400ms cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(229,9,20,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircle size={28} color="#e50914" />
      </div>
      <div>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 20,
            fontWeight: 800,
            color: '#fff',
          }}
        >
          Expense logged!
        </p>
        <p style={{ margin: 0, fontSize: 14, color: '#b3b3b3' }}>
          {categoryIcon} {categoryName} — {fmt(amount)}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="button" onClick={onAnother} className="btn-ghost">
          Log another
        </button>
        <button type="button" onClick={onDashboard} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function LogExpense() {
  const router = useRouter()
  const amountRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [catsLoading, setCatsLoading] = useState(true)

  const [form, setForm] = useState<FormState>({
    categoryId: '',
    amount: '',
    note: '',
    expenseDate: todayISO(),
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Track last successful submission for the success banner
  const [lastAdded, setLastAdded] = useState<{
    amount: number
    categoryIcon: string
    categoryName: string
  } | null>(null)

  // Load categories on mount
  useEffect(() => {
    GetCategories()
      .then((cats) => {
        setCategories(cats)
        if (cats.length > 0) {
          setForm((f) => ({ ...f, categoryId: cats[0]._id }))
        }
      })
      .catch(() => setServerError('Failed to load categories'))
      .finally(() => setCatsLoading(false))
  }, [])

  // Focus amount after category auto-selects
  useEffect(() => {
    if (!catsLoading) {
      amountRef.current?.focus()
    }
  }, [catsLoading])

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    // Clear per-field error on change
    if (errors[field as keyof FieldErrors]) {
      setErrors((e) => ({ ...e, [field]: undefined }))
    }
    setServerError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = validate(form, categories)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setSubmitting(true)
    setServerError(null)
    try {
      await AddExpense({
        data: {
          categoryId: form.categoryId,
          amount: parseFloat(form.amount),
          note: form.note.trim() || undefined,
          expenseDate: new Date(form.expenseDate),
        },
      })
      const cat = categories.find((c) => c._id === form.categoryId)!
      setLastAdded({
        amount: parseFloat(form.amount),
        categoryIcon: cat.icon,
        categoryName: cat.name,
      })
    } catch {
      setServerError(
        'Something went wrong saving the expense. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setLastAdded(null)
    setForm({
      categoryId: categories[0]?._id ?? '',
      amount: '',
      note: '',
      expenseDate: todayISO(),
    })
    setErrors({})
    setServerError(null)
    setTimeout(() => amountRef.current?.focus(), 50)
  }

  const selectedCat = categories.find((c) => c._id === form.categoryId)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(n)

  return (
    <main className="page-wrap" style={{ padding: '2rem 0 4rem' }}>
      {/* ── Page title ── */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="kicker" style={{ margin: '0 0 4px' }}>
          Log
        </p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>
          New Expense
        </h1>
      </div>

      {/* ── Two-column layout on wider screens ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* ── Form column ── */}
        <div
          style={{
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '2rem',
          }}
        >
          {lastAdded ? (
            <SuccessBanner
              amount={lastAdded.amount}
              categoryIcon={lastAdded.categoryIcon}
              categoryName={lastAdded.categoryName}
              onAnother={resetForm}
              onDashboard={() => router.navigate({ to: '/' })}
            />
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} noValidate>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
              >
                {/* Category */}
                <div>
                  <FieldLabel htmlFor="categoryId">Category</FieldLabel>
                  <CategoryPicker
                    categories={categories}
                    value={form.categoryId}
                    onChange={(id) => set('categoryId', id)}
                    error={errors.categoryId}
                    loading={catsLoading}
                  />
                </div>

                {/* Amount */}
                <div>
                  <FieldLabel htmlFor="amount">Amount</FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: errors.amount ? '#e50914' : '#808080',
                        fontSize: 15,
                        fontWeight: 600,
                        pointerEvents: 'none',
                      }}
                    >
                      £
                    </span>
                    <input
                      id="amount"
                      ref={amountRef}
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => set('amount', e.target.value)}
                      style={{
                        ...inputStyle(!!errors.amount),
                        paddingLeft: 28,
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = errors.amount
                          ? '#e50914'
                          : 'rgba(229,9,20,0.6)')
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = errors.amount
                          ? '#e50914'
                          : 'rgba(255,255,255,0.12)')
                      }
                    />
                  </div>
                  <FieldError msg={errors.amount} />
                </div>

                {/* Date */}
                <div>
                  <FieldLabel htmlFor="expenseDate">Date</FieldLabel>
                  <input
                    id="expenseDate"
                    type="date"
                    value={form.expenseDate}
                    max={todayISO()}
                    onChange={(e) => set('expenseDate', e.target.value)}
                    style={{
                      ...inputStyle(!!errors.expenseDate),
                      colorScheme: 'dark',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = errors.expenseDate
                        ? '#e50914'
                        : 'rgba(229,9,20,0.6)')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = errors.expenseDate
                        ? '#e50914'
                        : 'rgba(255,255,255,0.12)')
                    }
                  />
                  <FieldError msg={errors.expenseDate} />
                </div>

                {/* Note */}
                <div>
                  <FieldLabel htmlFor="note">
                    Note{' '}
                    <span
                      style={{
                        opacity: 0.5,
                        fontWeight: 400,
                        textTransform: 'none',
                        letterSpacing: 0,
                      }}
                    >
                      — optional
                    </span>
                  </FieldLabel>
                  <textarea
                    id="note"
                    placeholder="What did you spend it on?"
                    value={form.note}
                    onChange={(e) => set('note', e.target.value)}
                    maxLength={280}
                    rows={3}
                    style={{
                      ...inputStyle(false),
                      resize: 'vertical',
                      minHeight: 80,
                      lineHeight: 1.5,
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = 'rgba(229,9,20,0.6)')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.12)')
                    }
                  />
                  {form.note.length > 200 && (
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 11,
                        color: '#808080',
                        textAlign: 'right',
                      }}
                    >
                      {form.note.length}/280
                    </p>
                  )}
                </div>

                {/* Server error */}
                {serverError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(229,9,20,0.1)',
                      border: '1px solid rgba(229,9,20,0.3)',
                      borderRadius: 6,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: '#ff6b6b',
                    }}
                  >
                    <AlertCircle size={14} />
                    {serverError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || catsLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                    fontSize: 15,
                    opacity: submitting || catsLoading ? 0.6 : 1,
                    cursor:
                      submitting || catsLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader
                        size={16}
                        style={{ animation: 'spin 0.8s linear infinite' }}
                      />
                      Saving…
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      Log Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Preview / summary panel ── */}
        <div
          style={{
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '1.5rem',
            position: 'sticky',
            top: '80px',
          }}
        >
          <p
            style={{
              margin: '0 0 1rem',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#808080',
            }}
          >
            Preview
          </p>

          {/* Big amount display */}
          <p
            style={{
              margin: '0 0 1.25rem',
              fontSize: 38,
              fontWeight: 900,
              color:
                form.amount && parseFloat(form.amount) > 0 ? '#fff' : '#303030',
              lineHeight: 1,
              transition: 'color 150ms ease',
            }}
          >
            {form.amount && parseFloat(form.amount) > 0
              ? fmt(parseFloat(form.amount))
              : '£—'}
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: 13,
            }}
          >
            <PreviewRow
              label="Category"
              value={
                selectedCat ? `${selectedCat.icon} ${selectedCat.name}` : '—'
              }
            />
            <PreviewRow
              label="Date"
              value={
                form.expenseDate
                  ? new Date(form.expenseDate + 'T00:00:00').toLocaleDateString(
                      'en-GB',
                      { day: 'numeric', month: 'long', year: 'numeric' },
                    )
                  : '—'
              }
            />
            <PreviewRow
              label="Note"
              value={
                form.note.trim() || (
                  <span style={{ color: '#303030' }}>None</span>
                )
              }
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes rise-in {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type='number'] { -moz-appearance: textfield; }
        input[type='date']::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor:pointer; }
        @media (max-width: 680px) {
          .log-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}

function PreviewRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        paddingBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span style={{ color: '#808080', flexShrink: 0 }}>{label}</span>
      <span
        style={{ color: '#fff', textAlign: 'right', wordBreak: 'break-word' }}
      >
        {value}
      </span>
    </div>
  )
}
