import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import {
  Pencil,
  Trash2,
  PlusCircle,
  Tag,
  X,
  AlertCircle,
  Loader,
  Check,
} from 'lucide-react'
import {
  GetCategories,
  CreateCategory,
  UpdateCategory,
  DeleteCategory,
  GetCategoryExpenseCount,
} from '#/server/categories'

export const Route = createFileRoute('/categories')({
  component: CategoriesPage,
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  _id: string
  name: string
  icon: string
}

// ─── Emoji options ────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  '🍔',
  '🍕',
  '🍣',
  '🍜',
  '☕',
  '🧃',
  '🍺',
  '🛒',
  '🚗',
  '🚕',
  '🚌',
  '✈️',
  '🚂',
  '⛽',
  '🅿️',
  '🛵',
  '🏠',
  '💡',
  '📺',
  '🛋️',
  '🔧',
  '🧹',
  '📦',
  '🔑',
  '👕',
  '👟',
  '👜',
  '💄',
  '🧴',
  '💊',
  '🏋️',
  '💅',
  '🎬',
  '🎮',
  '🎵',
  '📚',
  '🎨',
  '🎲',
  '🎭',
  '⚽',
  '🏥',
  '🩺',
  '🧘',
  '💉',
  '🦷',
  '👓',
  '🩹',
  '💻',
  '📱',
  '⌨️',
  '🖨️',
  '🎧',
  '📷',
  '🔋',
  '💾',
  '🎁',
  '🎉',
  '🪴',
  '🐶',
  '🐱',
  '✂️',
  '🧺',
  '😮‍💨',
]

// ─── Category Form Modal (used for both create and edit) ─────────────────────

function CategoryFormModal({
  initial,
  onSave,
  onClose,
  title,
}: {
  initial?: Category
  onSave: (name: string, icon: string) => Promise<void>
  onClose: () => void
  title: string
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? EMOJI_OPTIONS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(name.trim(), icon)
      onClose()
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(6px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '1.75rem',
          width: '100%',
          maxWidth: 460,
          animation: 'rise-in 220ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(229,9,20,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag size={16} color="#e50914" />
            </div>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 16,
                color: '#fff',
              }}
            >
              {title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#808080',
              cursor: 'pointer',
              width: 30,
              height: 30,
            }}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Preview */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '12px 16px',
              }}
            >
              <span style={{ fontSize: 32, lineHeight: 1 }}>{icon}</span>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: name.trim() ? '#fff' : '#404040',
                  }}
                >
                  {name.trim() || 'Category name'}
                </p>
                <p
                  style={{ margin: '2px 0 0', fontSize: 11, color: '#606060' }}
                >
                  Preview
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="cat-name"
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
                Name
              </label>
              <input
                id="cat-name"
                ref={nameRef}
                type="text"
                placeholder="e.g. Groceries"
                value={name}
                maxLength={32}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                style={{
                  width: '100%',
                  background: '#1f1f1f',
                  border: `1px solid ${error ? '#e50914' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 15,
                  fontFamily: 'inherit',
                  padding: '10px 14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = error
                    ? '#e50914'
                    : 'rgba(229,9,20,0.6)')
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = error
                    ? '#e50914'
                    : 'rgba(255,255,255,0.12)')
                }
              />
              {error && (
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
                  <AlertCircle size={12} /> {error}
                </p>
              )}
            </div>

            {/* Emoji grid */}
            <div>
              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: '#b3b3b3',
                }}
              >
                Icon
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: 6,
                  background: '#0d0d0d',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  padding: '10px',
                  maxHeight: 192,
                  overflowY: 'auto',
                }}
              >
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    title={e}
                    style={{
                      fontSize: 20,
                      lineHeight: 1,
                      padding: '6px',
                      background:
                        icon === e ? 'rgba(229,9,20,0.2)' : 'transparent',
                      border: `1.5px solid ${icon === e ? '#e50914' : 'transparent'}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 100ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                marginTop: 4,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="btn-primary"
                style={{
                  opacity: saving || !name.trim() ? 0.6 : 1,
                  cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? (
                  <>
                    <Loader
                      size={14}
                      style={{ animation: 'spin 0.8s linear infinite' }}
                    />{' '}
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={14} /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({
  category,
  onConfirm,
  onCancel,
}: {
  category: Category
  onConfirm: (cascade: boolean) => Promise<void>
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [expenseCount, setExpenseCount] = useState<number | null>(null)
  const [cascade, setCascade] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    GetCategoryExpenseCount({ data: { id: category._id } })
      .then(({ count }) => setExpenseCount(count))
      .catch(() => setExpenseCount(0))

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [category._id, onCancel])

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await onConfirm(cascade)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to delete')
      setLoading(false)
    }
  }

  const hasExpenses = expenseCount !== null && expenseCount > 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(6px)',
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
          maxWidth: 420,
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
          Delete category?
        </h2>
        <p style={{ margin: '0 0 6px', fontSize: 15, color: '#b3b3b3' }}>
          <span style={{ fontSize: 20 }}>{category.icon}</span>{' '}
          <strong style={{ color: '#fff' }}>{category.name}</strong>
        </p>

        {expenseCount === null ? (
          <p style={{ margin: '0 0 1rem', fontSize: 13, color: '#606060' }}>
            Checking linked expenses…
          </p>
        ) : hasExpenses ? (
          <div
            style={{
              margin: '12px 0',
              background: 'rgba(229,9,20,0.08)',
              border: '1px solid rgba(229,9,20,0.25)',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#ff9f9f' }}>
              <AlertCircle
                size={13}
                style={{ display: 'inline', marginRight: 6 }}
              />
              This category has <strong>{expenseCount}</strong> associated
              expense{expenseCount === 1 ? '' : 's'}.
            </p>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#b3b3b3',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={cascade}
                onChange={(e) => setCascade(e.target.checked)}
                style={{
                  accentColor: '#e50914',
                  width: 15,
                  height: 15,
                  cursor: 'pointer',
                }}
              />
              Also delete all {expenseCount} expense
              {expenseCount === 1 ? '' : 's'}
            </label>
            {!cascade && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#606060' }}>
                If unchecked, those expenses will remain but lose their category
                link.
              </p>
            )}
          </div>
        ) : (
          <p style={{ margin: '0 0 1rem', fontSize: 13, color: '#808080' }}>
            No expenses are linked to this category.
          </p>
        )}

        {error && (
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              color: '#ff6b6b',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertCircle size={13} /> {error}
          </p>
        )}

        <p style={{ margin: '0 0 1.5rem', fontSize: 13, color: '#606060' }}>
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
            onClick={() => void handleConfirm()}
            disabled={loading || expenseCount === null}
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
              cursor:
                loading || expenseCount === null ? 'not-allowed' : 'pointer',
              opacity: loading || expenseCount === null ? 0.6 : 1,
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

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category
  onEdit: () => void
  onDelete: () => void
}) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#1a1a1a' : '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'background 120ms ease',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {category.icon}
      </div>

      {/* Name */}
      <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: '#fff' }}>
        {category.name}
      </span>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          opacity: hover ? 1 : 0,
          transition: 'opacity 120ms ease',
        }}
      >
        <button
          type="button"
          onClick={onEdit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            color: '#b3b3b3',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 4,
            padding: '5px 12px',
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
          <Pencil size={11} /> Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            color: '#808080',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            padding: '5px 10px',
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
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deletingCat, setDeletingCat] = useState<Category | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const cats = await GetCategories()
      setCategories(cats)
    } catch {
      setLoadError('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleCreate(name: string, icon: string) {
    const cat = await CreateCategory({ data: { name, icon } })
    setCategories((prev) => [...prev, cat])
  }

  async function handleUpdate(name: string, icon: string) {
    if (!editingCat) return
    const updated = await UpdateCategory({
      data: { id: editingCat._id, name, icon },
    })
    setCategories((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c)),
    )
  }

  async function handleDelete(cascade: boolean) {
    if (!deletingCat) return
    await DeleteCategory({ data: { id: deletingCat._id, cascade } })
    setCategories((prev) => prev.filter((c) => c._id !== deletingCat._id))
    setDeletingCat(null)
  }

  return (
    <main className="page-wrap" style={{ padding: '2rem 0 4rem' }}>
      {/* Page header */}
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
            Manage
          </p>
          <h1
            style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}
          >
            Categories
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          <PlusCircle size={15} /> New Category
        </button>
      </div>

      {/* Content */}
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
            All Categories
            {!loading && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  color: '#808080',
                  fontWeight: 400,
                }}
              >
                {categories.length}{' '}
                {categories.length === 1 ? 'category' : 'categories'}
              </span>
            )}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div
            style={{
              padding: '1.5rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 68,
                  background: '#1f1f1f',
                  borderRadius: 10,
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Error */}
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
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !loadError && categories.length === 0 && (
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
            <span style={{ fontSize: 36 }}>🏷️</span>
            <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>
              No categories yet
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#808080' }}>
              Create your first category to start logging expenses.
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="btn-primary"
              style={{ marginTop: 12 }}
            >
              <PlusCircle size={14} /> New Category
            </button>
          </div>
        )}

        {/* Category list */}
        {!loading && !loadError && categories.length > 0 && (
          <div
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {categories.map((cat) => (
              <CategoryCard
                key={cat._id}
                category={cat}
                onEdit={() => setEditingCat(cat)}
                onDelete={() => setDeletingCat(cat)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CategoryFormModal
          title="New Category"
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Edit modal */}
      {editingCat && (
        <CategoryFormModal
          title="Edit Category"
          initial={editingCat}
          onSave={handleUpdate}
          onClose={() => setEditingCat(null)}
        />
      )}

      {/* Delete modal */}
      {deletingCat && (
        <DeleteModal
          category={deletingCat}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCat(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes rise-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </main>
  )
}
