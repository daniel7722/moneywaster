import { createServerFn } from '@tanstack/react-start'
import mongoose from 'mongoose'
import { connectDb } from '#/lib/db'
import { Expenses } from '#/models/expenses'
import { Categories } from '#/models/categories'

// ─── Validators ──────────────────────────────────────────────────────────────

const monthYearValidator = (input: { month: number; year: number }) => {
  if (!input.month || !input.year) throw new Error('month and year required')
  if (input.month < 1 || input.month > 12) throw new Error('month must be 1–12')
  return input
}

// ─── Helper: format month label ───────────────────────────────────────────────

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('en-GB', {
    month: 'short',
    year: 'numeric',
  })
}

// ─── 1. Stat cards ────────────────────────────────────────────────────────────

export const GetDashboardStats = createServerFn({ method: 'POST' })
  .inputValidator(monthYearValidator)
  .handler(async ({ data: { month, year } }) => {
    await connectDb()

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    const [summary] = await Expenses.aggregate([
      { $match: { expenseDate: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ])

    const [topCat] = await Expenses.aggregate([
      { $match: { expenseDate: { $gte: start, $lt: end } } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'cat',
        },
      },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: '$cat.name',
          icon: '$cat.icon',
          total: 1,
        },
      },
    ])

    return {
      total: summary?.total ?? 0,
      count: summary?.count ?? 0,
      topCategory: topCat
        ? {
            name: topCat.name as string,
            icon: topCat.icon as string,
            total: topCat.total as number,
          }
        : null,
    }
  })

// ─── 2. Bar chart — spending by category for a given month ───────────────────

export const GetBarChartData = createServerFn({ method: 'POST' })
  .inputValidator(monthYearValidator)
  .handler(async ({ data: { month, year } }) => {
    await connectDb()

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    const rows = await Expenses.aggregate([
      { $match: { expenseDate: { $gte: start, $lt: end } } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'cat',
        },
      },
      { $unwind: '$cat' },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          category: {
            $concat: [{ $ifNull: ['$cat.icon', ' '] }, ' ', '$cat.name'],
          },
          total: 1,
        },
      },
    ])

    return rows as Array<{ category: string; total: number }>
  })

// ─── 3. Line chart — monthly totals all time ─────────────────────────────────

export const GetMonthlyTotals = createServerFn({ method: 'POST' }).handler(
  async () => {
    await connectDb()

    const rows = await Expenses.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          label: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: 1,
                },
              },
            },
          },
          year: '$_id.year',
          month: '$_id.month',
          total: 1,
        },
      },
    ])

    return rows.map(
      (r: { label: string; year: number; month: number; total: number }) => ({
        label: r.label,
        displayLabel: monthLabel(r.year, r.month),
        total: r.total,
      }),
    )
  },
)

// ─── 4. Category trend — monthly totals for one or more categories ────────────

export const GetCategoryTrend = createServerFn({ method: 'POST' })
  .inputValidator((input: { categoryIds: string[] }) => {
    if (!input.categoryIds?.length) throw new Error('categoryIds required')
    return input
  })
  .handler(async ({ data: { categoryIds } }) => {
    await connectDb()

    const objectIds = categoryIds.map((id) => new mongoose.Types.ObjectId(id))

    const rows = await Expenses.aggregate([
      { $match: { categoryId: { $in: objectIds } } },
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    return rows.map(
      (r: { _id: { year: number; month: number }; total: number }) => ({
        displayLabel: monthLabel(r._id.year, r._id.month),
        total: r.total,
      }),
    )
  })

// ─── 5b. Per-category spend for the selected month + prior 5 months ──────────

export const GetCategoryMonthlyComparison = createServerFn({ method: 'GET' })
  .inputValidator(monthYearValidator)
  .handler(async ({ data: { month, year } }) => {
    await connectDb()

    // Build 6 month windows: [month-5 … month] inclusive
    const windows: Array<{ year: number; month: number; label: string }> = []
    for (let i = 5; i >= 0; i--) {
      let m = month - i
      let y = year
      while (m <= 0) {
        m += 12
        y -= 1
      }
      windows.push({ year: y, month: m, label: monthLabel(y, m) })
    }

    const earliest = windows[0]
    const start = new Date(earliest.year, earliest.month - 1, 1)
    const end = new Date(year, month, 1)

    const rows = await Expenses.aggregate([
      { $match: { expenseDate: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            categoryId: '$categoryId',
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' },
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id.categoryId',
          foreignField: '_id',
          as: 'cat',
        },
      },
      { $unwind: '$cat' },
      {
        $project: {
          _id: 0,
          categoryId: { $toString: '$_id.categoryId' },
          categoryName: '$cat.name',
          categoryIcon: '$cat.icon',
          year: '$_id.year',
          month: '$_id.month',
          total: 1,
        },
      },
    ])

    type Row = {
      categoryId: string
      categoryName: string
      categoryIcon: string
      year: number
      month: number
      total: number
    }

    const lookup = new Map<string, number>()
    for (const r of rows as Row[]) {
      lookup.set(`${r.categoryId}|${r.year}-${r.month}`, r.total)
    }

    const catMap = new Map<string, { name: string; icon: string }>()
    for (const r of rows as Row[]) {
      if (!catMap.has(r.categoryId))
        catMap.set(r.categoryId, { name: r.categoryName, icon: r.categoryIcon })
    }

    return {
      months: windows.map((w) => w.label),
      categories: Array.from(catMap.entries()).map(([id, { name, icon }]) => ({
        id,
        name,
        icon,
        label: `${icon} ${name}`,
        values: windows.map(
          (w) => lookup.get(`${id}|${w.year}-${w.month}`) ?? 0,
        ),
      })),
    }
  })

// ─── 5. All categories (for the trend selector dropdown) ─────────────────────

export const GetAllCategories = createServerFn({ method: 'POST' }).handler(
  async () => {
    await connectDb()
    const cats = await Categories.find({}).lean()
    return cats.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      icon: c.icon ?? '',
    }))
  },
)
