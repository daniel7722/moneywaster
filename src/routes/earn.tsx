import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { CheckCircle, AlertCircle, PlusCircle, Loader } from 'lucide-react'
import { AddEarning } from '#/server/earnings'

export const Route = createFileRoute('/earn')({ component: LogEarning })

interface FormState {
  amount: string
  note: string
  earnedDate: string
}

interface FieldErrors {
  amount?: string
  earnedDate?: string
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: '#1f1f1f',
    border: `1px solid ${hasError ? '#22c55e' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 6,
    color: '#fff',
    fontSize: 15,
    fontFamily: 'inherit',
    padding: '11px 14px',
    outline: 'none',
    boxSizing: 'border-box',
  }
}

function LogEarning() {
  const router = useRouter()
  const amountRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    amount: '',
    note: '',
    earnedDate: todayISO(),
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [lastAdded, setLastAdded] = useState<{ amount: number } | null>(null)

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
    setServerError(null)
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0)
      errs.amount = 'Enter a positive amount'
    if (amt > 10_000_000) errs.amount = 'Amount seems too large'
    if (!form.earnedDate) errs.earnedDate = 'Pick a date'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setSubmitting(true)
    setServerError(null)
    try {
      await AddEarning({
        data: {
          amount: parseFloat(form.amount),
          note: form.note.trim() || undefined,
          earnedDate: new Date(form.earnedDate),
        },
      })
      setLastAdded({ amount: parseFloat(form.amount) })
    } catch {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setLastAdded(null)
    setForm({ amount: '', note: '', earnedDate: todayISO() })
    setErrors({})
    setServerError(null)
    setTimeout(() => amountRef.current?.focus(), 50)
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(n)

  const GREEN = '#22c55e'

  return (
    <main className="page-wrap" style={{ padding: '2rem 0 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p className="kicker" style={{ margin: '0 0 4px', color: GREEN }}>
          Earn
        </p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>
          Log Earning
        </h1>
      </div>

      <div style={{ maxWidth: 520 }}>
        <div
          style={{
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '2rem',
          }}
        >
          {lastAdded ? (
            <div
              style={{
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
                  background: 'rgba(34,197,94,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={28} color={GREEN} />
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
                  Earning logged!
                </p>
                <p style={{ margin: 0, fontSize: 14, color: '#b3b3b3' }}>
                  {fmt(lastAdded.amount)} added to your earnings
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={resetForm} className="btn-ghost">
                  Log another
                </button>
                <button
                  type="button"
                  onClick={() => router.navigate({ to: '/' })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: GREEN,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    padding: '8px 20px',
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} noValidate>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
              >
                {/* Amount */}
                <div>
                  <label
                    htmlFor="amount"
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
                    Amount
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#808080',
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
                        (e.currentTarget.style.borderColor = GREEN)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = errors.amount
                          ? GREEN
                          : 'rgba(255,255,255,0.12)')
                      }
                      autoFocus
                    />
                  </div>
                  {errors.amount && (
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: 12,
                        color: GREEN,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <AlertCircle size={12} />
                      {errors.amount}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label
                    htmlFor="earnedDate"
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
                    Date
                  </label>
                  <input
                    id="earnedDate"
                    type="date"
                    value={form.earnedDate}
                    max={todayISO()}
                    onChange={(e) => set('earnedDate', e.target.value)}
                    style={{
                      ...inputStyle(!!errors.earnedDate),
                      colorScheme: 'dark',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = GREEN)}
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = errors.earnedDate
                        ? GREEN
                        : 'rgba(255,255,255,0.12)')
                    }
                  />
                  {errors.earnedDate && (
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: 12,
                        color: GREEN,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <AlertCircle size={12} />
                      {errors.earnedDate}
                    </p>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label
                    htmlFor="note"
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
                  </label>
                  <textarea
                    id="note"
                    placeholder="Salary, freelance, side project…"
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
                    onFocus={(e) => (e.currentTarget.style.borderColor = GREEN)}
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.12)')
                    }
                  />
                </div>

                {serverError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: 6,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: '#86efac',
                    }}
                  >
                    <AlertCircle size={14} />
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: GREEN,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 15,
                    padding: '12px',
                    borderRadius: 4,
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    width: '100%',
                    opacity: submitting ? 0.6 : 1,
                    transition: 'opacity 150ms ease',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader
                        size={16}
                        style={{ animation: 'spin 0.8s linear infinite' }}
                      />{' '}
                      Saving…
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} /> Log Earning
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes rise-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type='number'] { -moz-appearance: textfield; }
        input[type='date']::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
      `}</style>
    </main>
  )
}
