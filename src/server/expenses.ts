import { createServerFn } from '@tanstack/react-start'
import { connectDb } from '#/lib/db'
import { Expenses } from '#/models/expenses'

const expenseValidator = (input: {
  categoryId: string
  amount: number
  note?: string
  expenseDate?: Date
}) => {
  if (!input.categoryId) {
    throw new Error('CategoryId is required')
  }
  if (!input.amount) {
    throw new Error('Amount is required')
  }
  return input
}

export const CreateTestExpense = createServerFn({
  method: 'POST',
})
  .inputValidator(expenseValidator)
  .handler(async ({ data }) => {
    try {
      console.log('Attempting to connect to DB...')
      await connectDb()
      console.log('Connected to DB successfully!')
      const newExpense = await Expenses.create(data)
      return {
        _id: newExpense._id.toString(),
        categoryId: newExpense.categoryId.toString(),
        amount: newExpense.amount,
        note: newExpense.note,
        expenseDate: newExpense.expenseDate,
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      throw new Error('Failed to create expense')
    }
  })
