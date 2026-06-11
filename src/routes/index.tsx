import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import {
  GetDashboardStats,
  GetBarChartData,
  GetMonthlyTotals,
  GetCategoryTrend,
  GetAllCategories,
  GetCategoryMonthlyComparison,
} from '#/server/analytics'

export const Route = createFileRoute('/')({ component: Dashboard })

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  total: number
  count: number
  topCategory: { name: string; icon: string; total: number } | null
}

interface BarRow {
  category: string
  total: number
}

interface LineRow {
  displayLabel: string
  total: number
  label?: string
}

interface Category {
  _id: string
  name: string
  icon: string
}

interface ComparisonData {
  months: string[]
  categories: Array<{
    id: string
    name: string
    icon: string
    label: string
    values: number[]
  }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(n)

const CRIMSON = '#e50914'
const BAR_COLORS = [
  '#e50914',
  '#ff6b6b',
  '#ff9f43',
  '#feca57',
  '#48dbfb',
  '#1dd1a1',
  '#c56cf0',
  '#fd79a8',
]

const MONTHS = [
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
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => current - i)
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#1f1f1f',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        padding: '8px 14px',
        fontSize: 13,
        color: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {label && (
        <p style={{ margin: '0 0 4px', color: '#b3b3b3', fontSize: 12 }}>
          {label}
        </p>
      )}
      <p style={{ margin: 0, fontWeight: 600 }}>{fmt(payload[0].value)}</p>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string
  value: string
  sub?: string
  loading: boolean
}) {
  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '1.25rem 1.5rem',
        flex: 1,
        minWidth: 160,
      }}
    >
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#808080',
        }}
      >
        {label}
      </p>
      {loading ? (
        <div
          style={{
            height: 32,
            background: '#303030',
            borderRadius: 4,
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      ) : (
        <>
          <p
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.1,
            }}
          >
            {value}
          </p>
          {sub && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#b3b3b3' }}>
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  sub,
  children,
  loading,
  empty,
  action,
}: {
  title: string
  sub?: string
  children: React.ReactNode
  loading: boolean
  empty: boolean
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 15,
              color: '#fff',
            }}
          >
            {title}
          </p>
          {sub && (
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#808080' }}>
              {sub}
            </p>
          )}
        </div>
        {action}
      </div>

      {loading ? (
        <div
          style={{
            height: 240,
            background: '#1f1f1f',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#808080',
            fontSize: 13,
          }}
        >
          Loading…
        </div>
      ) : empty ? (
        <div
          style={{
            height: 240,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: '#808080',
          }}
        >
          <span style={{ fontSize: 32 }}>📭</span>
          <p style={{ margin: 0, fontSize: 13 }}>No data for this period</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

// ─── Category multi-select pills ─────────────────────────────────────────────

function CategoryPills({
  categories,
  selectedIds,
  onChange,
}: {
  categories: Category[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      // keep at least one selected
      if (selectedIds.length === 1) return
      onChange(selectedIds.filter((s) => s !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function selectAll() {
    onChange(categories.map((c) => c._id))
  }

  const allSelected = selectedIds.length === categories.length

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        alignItems: 'center',
        maxWidth: 520,
      }}
    >
      <button
        type="button"
        onClick={selectAll}
        style={{
          background: allSelected ? 'rgba(229,9,20,0.2)' : '#1f1f1f',
          border: `1px solid ${allSelected ? '#e50914' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 20,
          color: allSelected ? '#fff' : '#808080',
          padding: '3px 10px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 120ms ease',
        }}
      >
        All
      </button>
      {categories.map((c) => {
        const sel = selectedIds.includes(c._id)
        return (
          <button
            key={c._id}
            type="button"
            onClick={() => toggle(c._id)}
            style={{
              background: sel ? 'rgba(229,9,20,0.2)' : '#1f1f1f',
              border: `1px solid ${sel ? '#e50914' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20,
              color: sel ? '#fff' : '#808080',
              padding: '3px 10px',
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 120ms ease',
            }}
          >
            {c.icon} {c.name}
          </button>
        )
      })}
    </div>
  )
}
// ─── Category History Chart ───────────────────────────────────────────────────

const HISTORY_COLORS = [
  '#e50914',
  '#ff6b6b',
  '#ff9f43',
  '#feca57',
  '#48dbfb',
  '#1dd1a1',
  '#c56cf0',
  '#fd79a8',
]

function CategoryHistoryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#1f1f1f',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        padding: '10px 14px',
        fontSize: 13,
        color: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        minWidth: 160,
      }}
    >
      <p
        style={{
          margin: '0 0 6px',
          color: '#b3b3b3',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      {payload.map((p) => (
        <div
          key={p.name}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 3,
          }}
        >
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  const { month: initMonth, year: initYear } = currentMonthYear()

  const [month, setMonth] = useState(initMonth)
  const [year, setYear] = useState(initYear)

  const [statsLoading, setStatsLoading] = useState(true)
  const [barLoading, setBarLoading] = useState(true)
  const [lineLoading, setLineLoading] = useState(true)
  const [trendLoading, setTrendLoading] = useState(false)

  const [stats, setStats] = useState<Stats | null>(null)
  const [barData, setBarData] = useState<BarRow[]>([])
  const [lineData, setLineData] = useState<LineRow[]>([])
  const [trendData, setTrendData] = useState<LineRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([])

  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null,
  )
  const [comparisonLoading, setComparisonLoading] = useState(true)

  const selectedLabel = `${year}-${String(month).padStart(2, '0')}`

  // ── Load stats & bar chart whenever month/year changes ──
  const loadMonthly = useCallback(async () => {
    setStatsLoading(true)
    setBarLoading(true)
    setComparisonLoading(true)
    try {
      const [s, b, c] = await Promise.all([
        GetDashboardStats({ data: { month, year } }),
        GetBarChartData({ data: { month, year } }),
        GetCategoryMonthlyComparison({ data: { month, year } }),
      ])
      setStats(s)
      setBarData(b)
      setComparisonData(c)
    } finally {
      setStatsLoading(false)
      setBarLoading(false)
      setComparisonLoading(false)
    }
  }, [month, year])

  // ── Load all-time line chart once ──
  const loadAllTime = useCallback(async () => {
    setLineLoading(true)
    try {
      const rows = await GetMonthlyTotals()
      setLineData(rows)
    } finally {
      setLineLoading(false)
    }
  }, [])

  // ── Load categories once ──
  const loadCategories = useCallback(async () => {
    const cats = await GetAllCategories()
    setCategories(cats)
    if (cats.length > 0 && selectedCatIds.length === 0) {
      setSelectedCatIds([cats[0]._id])
    }
  }, [selectedCatIds.length])

  // ── Load trend when selected categories change ──
  const loadTrend = useCallback(async (catIds: string[]) => {
    if (!catIds.length) return
    setTrendLoading(true)
    try {
      const rows = await GetCategoryTrend({ data: { categoryIds: catIds } })
      setTrendData(rows)
    } finally {
      setTrendLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMonthly()
  }, [loadMonthly])

  useEffect(() => {
    void loadAllTime()
    void loadCategories()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedCatIds.length > 0) void loadTrend(selectedCatIds)
  }, [selectedCatIds, loadTrend])

  // ── Trend chart label ──
  const trendSub = () => {
    if (categories.length === 0) return 'Select a category'
    if (selectedCatIds.length === categories.length)
      return 'All categories — monthly spend'
    if (selectedCatIds.length === 1) {
      const cat = categories.find((c) => c._id === selectedCatIds[0])
      return cat ? `${cat.icon} ${cat.name} — monthly spend` : 'Monthly spend'
    }
    return `${selectedCatIds.length} categories — combined monthly spend`
  }

  const selectedMonthName = MONTHS[month - 1]

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
            Overview
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            Dashboard
          </h1>
        </div>

        {/* ── Global month/year filter ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '6px 12px',
          }}
        >
          <label style={{ fontSize: 12, color: '#808080', fontWeight: 500 }}>
            Period
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={selectStyle}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={selectStyle}
          >
            {buildYearOptions().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <StatCard
          label="Total Spent"
          value={fmt(stats?.total ?? 0)}
          sub={`${selectedMonthName} ${year}`}
          loading={statsLoading}
        />
        <StatCard
          label="Transactions"
          value={String(stats?.count ?? 0)}
          sub={`${selectedMonthName} ${year}`}
          loading={statsLoading}
        />
        <StatCard
          label="Top Category"
          value={
            stats?.topCategory
              ? `${stats.topCategory.icon} ${stats.topCategory.name}`
              : '—'
          }
          sub={stats?.topCategory ? fmt(stats.topCategory.total) : 'No data'}
          loading={statsLoading}
        />
      </div>

      {/* ── Charts grid ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Category history — 6-month grouped bars */}
        <ChartCard
          title="Category Breakdown — Last 6 Months"
          sub={`Each bar group is one month; bars are categories`}
          loading={comparisonLoading}
          empty={
            !comparisonLoading &&
            (!comparisonData || comparisonData.categories.length === 0)
          }
        >
          {comparisonData && comparisonData.categories.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={comparisonData.months.map((m, mi) => {
                    const row: Record<string, string | number> = { month: m }
                    for (const cat of comparisonData.categories) {
                      row[cat.label] = cat.values[mi]
                    }
                    return row
                  })}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#b3b3b3', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#808080', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `£${v}`}
                  />
                  <Tooltip
                    content={<CategoryHistoryTooltip />}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  {comparisonData.categories.map((cat, i) => (
                    <Bar
                      key={cat.id}
                      dataKey={cat.label}
                      fill={HISTORY_COLORS[i % HISTORY_COLORS.length]}
                      fillOpacity={0.85}
                      radius={[3, 3, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px 16px',
                  marginTop: 12,
                }}
              >
                {comparisonData.categories.map((cat, i) => (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: '#b3b3b3',
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: HISTORY_COLORS[i % HISTORY_COLORS.length],
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    {cat.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
        {/* Bar chart */}
        <ChartCard
          title={`Spending by Category`}
          sub={`${selectedMonthName} ${year}`}
          loading={barLoading}
          empty={!barLoading && barData.length === 0}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={barData}
              margin={{ top: 4, right: 16, left: 8, bottom: 48 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="category"
                tick={{ fill: '#b3b3b3', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fill: '#808080', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `£${v}`}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                    fillOpacity={0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* All-time monthly line chart */}
        <ChartCard
          title="Total Spending Over Time"
          sub={`All time — ${selectedMonthName} ${year} highlighted`}
          loading={lineLoading}
          empty={!lineLoading && lineData.length === 0}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={lineData}
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="displayLabel"
                tick={{ fill: '#b3b3b3', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#808080', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `£${v}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine
                x={
                  lineData.find((d) => d.label === selectedLabel)?.displayLabel
                }
                stroke={CRIMSON}
                strokeDasharray="4 3"
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={CRIMSON}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: CRIMSON,
                  stroke: '#000',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category trend line chart */}
        <ChartCard
          title="Category Trend"
          sub={trendSub()}
          loading={trendLoading}
          empty={!trendLoading && trendData.length === 0}
          action={
            categories.length > 0 ? (
              <CategoryPills
                categories={categories}
                selectedIds={selectedCatIds}
                onChange={setSelectedCatIds}
              />
            ) : null
          }
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={trendData}
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="displayLabel"
                tick={{ fill: '#b3b3b3', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#808080', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `£${v}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke={CRIMSON}
                strokeWidth={2}
                dot={{ r: 3, fill: CRIMSON, stroke: 'transparent' }}
                activeDot={{
                  r: 5,
                  fill: CRIMSON,
                  stroke: '#000',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pulse animation for loading skeleton */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  )
}

// ─── Shared select style ──────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  background: '#303030',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 4,
  color: '#fff',
  fontSize: 13,
  fontWeight: 500,
  padding: '4px 8px',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
}
