import { createServerFn } from '@tanstack/react-start'
import { connectDb } from '#/lib/db'
import { Earnings } from '#/models/earnings'

const earningValidator = (input: {
  amount: number
  note?: string
  earnedDate?: Date
}) => {
  if (!input.amount || input.amount <= 0)
    throw new Error('Amount must be a positive number')
  return input
}

export const AddEarning = createServerFn({ method: 'POST' })
  .inputValidator(earningValidator)
  .handler(async ({ data }) => {
    await connectDb()
    const earning = await Earnings.create(data)
    return {
      _id: earning._id.toString(),
      amount: earning.amount,
      note: earning.note ?? '',
      earnedDate: earning.earnedDate,
    }
  })

export const GetEarningsByMonth = createServerFn({ method: 'GET' })
  .inputValidator((input: { month: number; year: number }) => input)
  .handler(async ({ data: { month, year } }) => {
    await connectDb()
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)
    const earnings = await Earnings.find({
      earnedDate: { $gte: start, $lt: end },
    })
      .sort({ earnedDate: -1 })
      .lean()
    return earnings.map((e) => ({
      _id: e._id.toString(),
      amount: e.amount,
      note: e.note ?? '',
      earnedDate: e.earnedDate,
    }))
  })
