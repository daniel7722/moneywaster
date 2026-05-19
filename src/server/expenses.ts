import { createServerFn } from '@tanstack/react-start'
import mongoose from 'mongoose'
import { connectDb } from '#/lib/db'
import { Expenses } from '#/models/expenses'

const expenseValidator = (input: {
  categoryId: string
  amount: number
  note?: string
  expenseDate?: Date
}) => {
  if (!input.categoryId) throw new Error('CategoryId is required')
  if (!input.amount || input.amount <= 0)
    throw new Error('Amount must be a positive number')
  return input
}

export const CreateTestExpense = createServerFn({ method: 'POST' })
  .inputValidator(expenseValidator)
  .handler(async ({ data }) => {
    await connectDb()
    const newExpense = await Expenses.create(data)
    return {
      _id: newExpense._id.toString(),
      categoryId: newExpense.categoryId.toString(),
      amount: newExpense.amount,
      note: newExpense.note ?? '',
      expenseDate: newExpense.expenseDate,
    }
  })

// Used by the Log Expense form route (to be built next)
export const AddExpense = createServerFn({ method: 'POST' })
  .inputValidator(expenseValidator)
  .handler(async ({ data }) => {
    await connectDb()
    const expense = await Expenses.create({
      ...data,
      categoryId: new mongoose.Types.ObjectId(data.categoryId),
    })
    return {
      _id: expense._id.toString(),
      categoryId: expense.categoryId.toString(),
      amount: expense.amount,
      note: expense.note ?? '',
      expenseDate: expense.expenseDate,
    }
  })

// Used by the Ledger route (to be built after)
export const UpdateExpense = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: {
      id: string
      categoryId?: string
      amount?: number
      note?: string
      expenseDate?: Date
    }) => {
      if (!input.id) throw new Error('id is required')
      return input
    },
  )
  .handler(async ({ data: { id, ...fields } }) => {
    await connectDb()
    const updated = await Expenses.findByIdAndUpdate(
      id,
      {
        ...fields,
        ...(fields.categoryId
          ? { categoryId: new mongoose.Types.ObjectId(fields.categoryId) }
          : {}),
      },
      { new: true },
    )
    if (!updated) throw new Error('Expense not found')
    return { success: true }
  })

export const DeleteExpense = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string }) => {
    if (!input.id) throw new Error('id is required')
    return input
  })
  .handler(async ({ data: { id } }) => {
    await connectDb()
    await Expenses.findByIdAndDelete(id)
    return { success: true }
  })

export const GetExpensesByMonth = createServerFn({ method: 'GET' })
  .inputValidator((input: { month: number; year: number }) => input)
  .handler(async ({ data: { month, year } }) => {
    await connectDb()
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)
    const expenses = await Expenses.find({
      expenseDate: { $gte: start, $lt: end },
    })
      .populate('categoryId')
      .sort({ expenseDate: -1 })
      .lean()

    return expenses.map((e) => {
      const cat = e.categoryId as unknown as {
        _id: mongoose.Types.ObjectId
        name: string
        icon?: string
      }
      return {
        _id: e._id.toString(),
        categoryId: cat._id.toString(),
        categoryName: cat.name,
        categoryIcon: cat.icon ?? '',
        amount: e.amount,
        note: e.note ?? '',
        expenseDate: e.expenseDate,
      }
    })
  })
